import { describe, it, expect } from 'vitest';
import { sequenceTracks } from './sequence.js';
import { camelotDistance, toCamelot } from './camelot.js';
import type { SpotifyTrack } from '../spotify/types.js';
import type { AudioFeatures } from '../reccobeats/types.js';

function track(id: string, popularity = 50): SpotifyTrack {
  return { id, name: id, artists: ['test'], durationMs: 200_000, popularity };
}

function features(spotifyId: string, overrides: Partial<AudioFeatures> = {}): AudioFeatures {
  return {
    spotifyId,
    tempo: 120,
    energy: 0.5,
    danceability: 0.5,
    valence: 0.5,
    key: 0,
    mode: 1,
    ...overrides,
  };
}

describe('sequenceTracks', () => {
  it('orders three distinct tracks along the greedy nearest-neighbor path', () => {
    const tracks = [track('low'), track('mid'), track('high')];
    const featuresById = new Map([
      ['low', features('low', { energy: 0.1, tempo: 90 })],
      ['mid', features('mid', { energy: 0.5, tempo: 120 })],
      ['high', features('high', { energy: 0.95, tempo: 150 })],
    ]);

    const result = sequenceTracks(tracks, featuresById);

    expect(result.map((r) => r.track.id)).toEqual(['low', 'mid', 'high']);
  });

  it('never drops or duplicates tracks when features tie', () => {
    const tracks = [track('a'), track('b'), track('c'), track('d')];
    const featuresById = new Map(tracks.map((t) => [t.id, features(t.id)]));

    const result = sequenceTracks(tracks, featuresById);

    expect(result).toHaveLength(4);
    expect(new Set(result.map((r) => r.track.id)).size).toBe(4);
  });

  it('keeps a track with no vibe data in the output with the fallback tag', () => {
    const tracks = [track('known1'), track('known2'), track('unknown')];
    const featuresById = new Map([
      ['known1', features('known1', { energy: 0.2 })],
      ['known2', features('known2', { energy: 0.8 })],
    ]);

    const result = sequenceTracks(tracks, featuresById);

    expect(result).toHaveLength(3);
    const unknownEntry = result.find((r) => r.track.id === 'unknown');
    expect(unknownEntry?.reasonTag).toBe('no vibe data — placed by popularity');
  });

  it('falls back to popularity ordering when no track has vibe data', () => {
    const tracks = [track('a', 10), track('b', 90), track('c', 50)];
    const featuresById = new Map<string, AudioFeatures>();

    const result = sequenceTracks(tracks, featuresById);

    expect(result.map((r) => r.track.id)).toEqual(['b', 'c', 'a']);
    expect(result.every((r) => r.reasonTag === 'no vibe data — placed by popularity')).toBe(true);
  });

  it('never drops or duplicates a larger mixed set', () => {
    const tracks = Array.from({ length: 12 }, (_, i) => track(`t${i}`, i * 5));
    const featuresById = new Map(
      tracks
        .filter((_, i) => i % 3 !== 0)
        .map((t, i) => [t.id, features(t.id, { energy: (i % 5) / 5, tempo: 90 + i * 3 })]),
    );

    const result = sequenceTracks(tracks, featuresById);

    expect(result).toHaveLength(12);
    expect(new Set(result.map((r) => r.track.id)).size).toBe(12);
  });
});

describe('camelotDistance', () => {
  it('is 0 for the same key', () => {
    expect(camelotDistance('8B', '8B')).toBe(0);
  });

  it('is 1 for relative major/minor (same number, different letter)', () => {
    expect(camelotDistance('8B', '8A')).toBe(1);
  });

  it('is 1 for adjacent number, same letter', () => {
    expect(camelotDistance('8B', '9B')).toBe(1);
  });

  it('is larger for harmonically distant keys', () => {
    expect(camelotDistance('1B', '7B')).toBeGreaterThan(1);
  });

  it('maps known Spotify key/mode pairs to expected Camelot codes', () => {
    expect(toCamelot(0, 1)).toBe('8B'); // C major
    expect(toCamelot(9, 0)).toBe('8A'); // A minor
  });
});
