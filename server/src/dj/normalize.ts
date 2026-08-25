export function minMaxNormalize(values: number[]): Map<number, number> {
  const map = new Map<number, number>();
  if (values.length === 0) return map;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  for (const v of values) {
    map.set(v, range === 0 ? 0.5 : (v - min) / range);
  }
  return map;
}
