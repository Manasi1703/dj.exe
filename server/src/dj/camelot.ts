// Maps Spotify's pitch-class key (0-11, C..B) + mode (0=minor,1=major) to the
// 24-slot Camelot wheel used by DJs for harmonic mixing compatibility.
const CAMELOT_MAJOR: Record<number, string> = {
  0: '8B', 1: '3B', 2: '10B', 3: '5B', 4: '12B', 5: '7B',
  6: '2B', 7: '9B', 8: '4B', 9: '11B', 10: '6B', 11: '1B',
};
const CAMELOT_MINOR: Record<number, string> = {
  0: '5A', 1: '12A', 2: '7A', 3: '2A', 4: '9A', 5: '4A',
  6: '11A', 7: '6A', 8: '1A', 9: '8A', 10: '3A', 11: '10A',
};

export function toCamelot(key: number, mode: number): string | null {
  if (key < 0 || key > 11) return null;
  return mode === 1 ? CAMELOT_MAJOR[key] : CAMELOT_MINOR[key];
}

const MAX_CAMELOT_DISTANCE = 6;

/**
 * 0 = identical key. 1 = compatible neighbor (same number diff letter, or
 * adjacent number same letter). Higher = more harmonically clashing.
 */
export function camelotDistance(camelotA: string, camelotB: string): number {
  if (camelotA === camelotB) return 0;

  const numA = parseInt(camelotA, 10);
  const letterA = camelotA.slice(-1);
  const numB = parseInt(camelotB, 10);
  const letterB = camelotB.slice(-1);

  if (numA === numB && letterA !== letterB) return 1;

  const rawDiff = Math.abs(numA - numB);
  const circularDiff = Math.min(rawDiff, 12 - rawDiff);

  if (circularDiff === 1 && letterA === letterB) return 1;

  return Math.min(circularDiff, MAX_CAMELOT_DISTANCE);
}

export function normalizedCamelotDistance(camelotA: string, camelotB: string): number {
  return camelotDistance(camelotA, camelotB) / MAX_CAMELOT_DISTANCE;
}
