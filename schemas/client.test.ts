import { describe, expect, it } from 'vitest';
import { clientFormSchema } from './client';
import { propertyFormSchema } from './property';
import { loginSchema } from './auth';
import { isValidCpf } from '@/validators/cpf';
import { isPriceRangeValid } from '@/validators/ranges';

describe('isValidCpf', () => {
  it('aceita CPF válido conhecido', () => {
    // CPF de teste com DV correto: 529.982.247-25
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejeita sequências e DV errado', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
    expect(isValidCpf('52998224726')).toBe(false);
  });
});

describe('isPriceRangeValid', () => {
  it('valida min <= max', () => {
    expect(isPriceRangeValid(100, 200)).toBe(true);
    expect(isPriceRangeValid(200, 100)).toBe(false);
    expect(isPriceRangeValid(null, 100)).toBe(true);
  });
});

describe('clientFormSchema', () => {
  it('exige nome e telefone', () => {
    const r = clientFormSchema.safeParse({ nome: '', telefone: '' });
    expect(r.success).toBe(false);
  });

  it('aceita payload mínimo válido', () => {
    const r = clientFormSchema.safeParse({
      nome: 'Maria',
      telefone: '(62) 99999-0000',
      email: '',
      cpf: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita range de preço invertido', () => {
    const r = clientFormSchema.safeParse({
      nome: 'Maria',
      telefone: '62999990000',
      precoMin: 500000,
      precoMax: 100000,
    });
    expect(r.success).toBe(false);
  });

  it('rejeita CPF inválido quando informado', () => {
    const r = clientFormSchema.safeParse({
      nome: 'Maria',
      telefone: '62999990000',
      cpf: '11111111111',
    });
    expect(r.success).toBe(false);
  });
});

describe('propertyFormSchema', () => {
  it('exige título e clientId', () => {
    const r = propertyFormSchema.safeParse({
      clientId: '',
      titulo: '',
      preco: 100,
    });
    expect(r.success).toBe(false);
  });

  it('aceita imóvel básico', () => {
    const r = propertyFormSchema.safeParse({
      clientId: 'abc',
      titulo: 'Apto 2Q',
      preco: 350000,
      bairro: 'Bueno',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita preço negativo', () => {
    const r = propertyFormSchema.safeParse({
      clientId: 'abc',
      titulo: 'X',
      preco: -1,
    });
    expect(r.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('valida email e senha', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(
      true
    );
    expect(loginSchema.safeParse({ email: 'x', password: '1' }).success).toBe(false);
  });
});
