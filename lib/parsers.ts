/** Parse moeda pt-BR ("1.234,56") → number. */
export function parseMoeda(val: string): number {
  if (!val || !String(val).trim()) return 0;
  return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
}

export function digitsOnly(val: string): string {
  return String(val ?? '').replace(/\D/g, '');
}

export function parseOptionalNumber(
  value: number | string | '' | null | undefined
): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseCpfDigits(val: string): string {
  return digitsOnly(val).slice(0, 11);
}
