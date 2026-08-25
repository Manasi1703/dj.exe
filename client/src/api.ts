import type { OrderedTrack, SpotifyTokenResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001';

export async function analyzePlaylist(
  playlistUrl: string,
  accessToken: string,
): Promise<OrderedTrack[]> {
  const res = await fetch(`${API_BASE_URL}/api/playlist/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ playlistUrl }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Analyze failed: ${res.status}`);
  }

  const data = (await res.json()) as { tracks: OrderedTrack[] };
  return data.tracks;
}

export async function exchangeAuthCode(
  code: string,
  codeVerifier: string,
): Promise<SpotifyTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, codeVerifier }),
  });
  if (!res.ok) throw new Error('Failed to complete Spotify login');
  return (await res.json()) as SpotifyTokenResponse;
}

export async function refreshAuthToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Failed to refresh Spotify token');
  return (await res.json()) as SpotifyTokenResponse;
}
