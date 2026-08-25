import type { SpotifyTrack } from './types.js';

export class PlaylistNotAccessibleError extends Error {}

export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim();

  const uriMatch = trimmed.match(/^spotify:playlist:([a-zA-Z0-9]+)$/);
  if (uriMatch) return uriMatch[1];

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
    if (match) return match[1];
  } catch {
    // not a URL
  }

  return null;
}

interface SpotifyApiPlaylistItemEntry {
  is_local: boolean;
  item: {
    id: string | null;
    name: string;
    duration_ms: number;
    type: string;
    artists: { name: string }[];
  } | null;
}

interface SpotifyApiItemsPage {
  items: SpotifyApiPlaylistItemEntry[];
  next: string | null;
}

// Spotify blocks GET /v1/playlists/{id}/tracks entirely as of the Development
// Mode lockdown (403 even on owned playlists); /items is the working replacement,
// with track fields nested under `item` instead of `track`, and no `popularity`.
export async function fetchPlaylistTracks(
  playlistId: string,
  accessToken: string,
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];

  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 404 || res.status === 403) {
      throw new PlaylistNotAccessibleError(
        'This playlist is not accessible. You can only analyze playlists you own.',
      );
    }
    if (!res.ok) {
      throw new Error(`Spotify playlist fetch failed: ${res.status}`);
    }

    const page = (await res.json()) as SpotifyApiItemsPage;

    for (const entry of page.items) {
      const t = entry.item;
      if (!t || !t.id || entry.is_local || t.type !== 'track') continue;
      tracks.push({
        id: t.id,
        name: t.name,
        artists: t.artists.map((a) => a.name),
        durationMs: t.duration_ms,
        popularity: 0,
      });
    }

    url = page.next;
  }

  return tracks;
}
