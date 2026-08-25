import { Router } from 'express';
import { parsePlaylistId, fetchPlaylistTracks, PlaylistNotAccessibleError } from '../spotify/playlists.js';
import { fetchAudioFeatures } from '../reccobeats/client.js';
import { sequenceTracks } from '../dj/sequence.js';

export const playlistRouter = Router();

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length);
}

playlistRouter.post('/analyze', async (req, res) => {
  const accessToken = extractBearerToken(req.headers.authorization);
  if (!accessToken) {
    res.status(401).json({ error: 'Missing Spotify access token' });
    return;
  }

  const { playlistUrl } = req.body as { playlistUrl?: string };

  if (!playlistUrl) {
    res.status(400).json({ error: 'playlistUrl is required' });
    return;
  }

  const playlistId = parsePlaylistId(playlistUrl);
  if (!playlistId) {
    res.status(400).json({ error: 'Could not parse a playlist ID from that URL' });
    return;
  }

  try {
    const tracks = await fetchPlaylistTracks(playlistId, accessToken);

    if (tracks.length === 0) {
      res.status(400).json({ error: 'This playlist has no playable tracks' });
      return;
    }

    let featuresById;
    try {
      featuresById = await fetchAudioFeatures(tracks.map((t) => t.id));
    } catch {
      featuresById = new Map();
    }

    const ordered = sequenceTracks(tracks, featuresById);
    res.json({ tracks: ordered });
  } catch (err) {
    if (err instanceof PlaylistNotAccessibleError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: 'Failed to analyze playlist', detail: String(err) });
  }
});
