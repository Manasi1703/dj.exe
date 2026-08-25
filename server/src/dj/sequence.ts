import type { SpotifyTrack } from '../spotify/types.js';
import type { AudioFeatures } from '../reccobeats/types.js';
import { minMaxNormalize } from './normalize.js';
import { toCamelot, normalizedCamelotDistance } from './camelot.js';

export interface OrderedTrack {
  track: SpotifyTrack;
  reasonTag: string;
}

const WEIGHTS = { tempo: 0.35, energy: 0.35, key: 0.2, valence: 0.1 };

interface Node {
  track: SpotifyTrack;
  features: AudioFeatures;
  normTempo: number;
  camelot: string | null;
}

function cost(a: Node, b: Node): number {
  const tempoDelta = Math.abs(a.normTempo - b.normTempo);
  const energyDelta = Math.abs(a.features.energy - b.features.energy);
  const valenceDelta = Math.abs(a.features.valence - b.features.valence);
  const keyDelta =
    a.camelot && b.camelot ? normalizedCamelotDistance(a.camelot, b.camelot) : 0.5;

  return (
    WEIGHTS.tempo * tempoDelta +
    WEIGHTS.energy * energyDelta +
    WEIGHTS.key * keyDelta +
    WEIGHTS.valence * valenceDelta
  );
}

function reasonTagFor(a: Node, b: Node): string {
  const tempoDelta = Math.abs(a.normTempo - b.normTempo);
  const keyDelta =
    a.camelot && b.camelot ? normalizedCamelotDistance(a.camelot, b.camelot) : 1;
  const energyDelta = b.features.energy - a.features.energy;

  if (keyDelta <= 1 / 6) return 'harmonic match';
  if (tempoDelta < 0.05) return 'tempo held';
  if (energyDelta > 0.1) return 'energy build';
  if (energyDelta < -0.1) return 'cooldown';
  return 'smooth transition';
}

function buildNodes(tracks: SpotifyTrack[], featuresById: Map<string, AudioFeatures>): Node[] {
  const withFeatures = tracks
    .map((track) => ({ track, features: featuresById.get(track.id) }))
    .filter((t): t is { track: SpotifyTrack; features: AudioFeatures } => t.features != null);

  const tempoNorm = minMaxNormalize(withFeatures.map((t) => t.features.tempo));

  return withFeatures.map(({ track, features }) => ({
    track,
    features,
    normTempo: tempoNorm.get(features.tempo) ?? 0.5,
    camelot: toCamelot(features.key, features.mode),
  }));
}

function greedySequence(nodes: Node[]): Node[] {
  if (nodes.length === 0) return [];

  const remaining = [...nodes];
  const start = remaining.reduce((lowest, n) =>
    n.features.energy < lowest.features.energy ? n : lowest,
  );
  remaining.splice(remaining.indexOf(start), 1);

  const ordered: Node[] = [start];
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestCost = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = cost(current, remaining[i]);
      if (c < bestCost) {
        bestCost = c;
        bestIndex = i;
      }
    }
    ordered.push(remaining[bestIndex]);
    remaining.splice(bestIndex, 1);
  }

  return ordered;
}

function insertNoDataTracks(
  ordered: SpotifyTrack[],
  noData: SpotifyTrack[],
): { track: SpotifyTrack; reasonTag: string | null }[] {
  if (noData.length === 0) {
    return ordered.map((track) => ({ track, reasonTag: null }));
  }

  const sortedNoData = [...noData].sort((a, b) => b.popularity - a.popularity);
  const result: { track: SpotifyTrack; reasonTag: string | null }[] = ordered.map((track) => ({
    track,
    reasonTag: null,
  }));

  const step = Math.max(1, Math.floor(result.length / (sortedNoData.length + 1)));
  sortedNoData.forEach((track, i) => {
    const insertAt = Math.min(result.length, (i + 1) * step);
    result.splice(insertAt, 0, { track, reasonTag: 'no vibe data — placed by popularity' });
  });

  return result;
}

function fallbackPopularityOrder(tracks: SpotifyTrack[]): OrderedTrack[] {
  return [...tracks]
    .sort((a, b) => b.popularity - a.popularity)
    .map((track) => ({ track, reasonTag: 'no vibe data — placed by popularity' }));
}

export function sequenceTracks(
  tracks: SpotifyTrack[],
  featuresById: Map<string, AudioFeatures>,
): OrderedTrack[] {
  const nodes = buildNodes(tracks, featuresById);
  const noData = tracks.filter((t) => !featuresById.has(t.id));

  if (nodes.length === 0) {
    return fallbackPopularityOrder(tracks);
  }

  const orderedNodes = greedySequence(nodes);
  const withTags: OrderedTrack[] = orderedNodes.map((node, i) => ({
    track: node.track,
    reasonTag: i === 0 ? 'set opener' : reasonTagFor(orderedNodes[i - 1], node),
  }));

  const merged = insertNoDataTracks(
    withTags.map((t) => t.track),
    noData,
  );

  return merged.map(({ track, reasonTag }) => {
    if (reasonTag) return { track, reasonTag };
    const found = withTags.find((t) => t.track.id === track.id);
    return { track, reasonTag: found?.reasonTag ?? 'smooth transition' };
  });
}
