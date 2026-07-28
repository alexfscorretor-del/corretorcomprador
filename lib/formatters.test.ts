import { describe, expect, it } from 'vitest';
import { formatMoeda, maskMoeda, maskTelefone, maskCpf } from './formatters';
import { parseMoeda } from './parsers';

describe('parseMoeda / formatMoeda / maskMoeda', () => {
  it('parseMoeda lê pt-BR', () => {
    expect(parseMoeda('1.234,56')).toBeCloseTo(1234.56);
    expect(parseMoeda('')).toBe(0);
    expect(parseMoeda('10,00')).toBe(10);
  });

  it('formatMoeda formata e trata vazio', () => {
    expect(formatMoeda(undefined)).toBe('');
    expect(formatMoeda(0)).toBe('');
    expect(formatMoeda(1500)).toMatch(/1\.500,00/);
  });

  it('maskMoeda a partir de dígitos', () => {
    expect(maskMoeda('')).toBe('');
    expect(maskMoeda('1000')).toMatch(/10,00/);
  });

  it('round-trip mask → parse', () => {
    const masked = maskMoeda('250000'); // 2500,00
    expect(parseMoeda(masked)).toBeCloseTo(2500);
  });
});

describe('maskTelefone', () => {
  it('formata celular 11 dígitos', () => {
    expect(maskTelefone('62999990000')).toBe('(62) 99999-0000');
  });

  it('formata fixo 10 dígitos', () => {
    expect(maskTelefone('6233334444')).toBe('(62) 3333-4444');
  });
});

describe('maskCpf', () => {
  it('aplica máscara progressiva', () => {
    expect(maskCpf('12345678901')).toBe('123.456.789-01');
  });
});
