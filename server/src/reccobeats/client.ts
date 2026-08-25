import { config } from '../config.js';
import type { AudioFeatures } from './types.js';

const BATCH_SIZE = 40;
const MAX_CONCURRENT_BATCHES = 5;

interface ReccoBeatsFeatureItem {
  href: string;
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  key: number;
  mode: number;
}

interface ReccoBeatsFeaturesResponse {
  content: ReccoBeatsFeatureItem[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function extractSpotifyId(href: string): string | null {
  const match = href.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function fetchBatch(ids: string[]): Promise<AudioFeatures[]> {
  const url = `${config.reccobeatsBaseUrl}/v1/audio-features?ids=${ids.join(',')}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as ReccoBeatsFeaturesResponse;

  const results: AudioFeatures[] = [];
  for (const item of data.content) {
    const spotifyId = extractSpotifyId(item.href);
    if (!spotifyId) continue;
    results.push({
      spotifyId,
      tempo: item.tempo,
      energy: item.energy,
      danceability: item.danceability,
      valence: item.valence,
      key: item.key,
      mode: item.mode,
    });
  }
  return results;
}

export async function fetchAudioFeatures(
  spotifyTrackIds: string[],
): Promise<Map<string, AudioFeatures>> {
  const featuresById = new Map<string, AudioFeatures>();
  const batches = chunk(spotifyTrackIds, BATCH_SIZE);

  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const group = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
    const groupResults = await Promise.all(group.map((batch) => fetchBatch(batch)));
    for (const batchResult of groupResults) {
      for (const feature of batchResult) {
        featuresById.set(feature.spotifyId, feature);
      }
    }
  }

  return featuresById;
}
