export function isNonNegative(n: number | undefined | null): boolean {
  if (n === undefined || n === null) return true;
  return Number.isFinite(n) && n >= 0;
}

export function isPriceRangeValid(
  min?: number | null,
  max?: number | null
): boolean {
  if (min == null || max == null) return true;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return min <= max;
}
