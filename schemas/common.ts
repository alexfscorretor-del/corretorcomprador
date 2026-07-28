import { z } from 'zod';
import { isValidCpf } from '@/validators/cpf';

export const triStateSchema = z.enum(['sim', 'nao', 'indiferente']);
export const businessStatusSchema = z.enum([
  'fechou',
  'nao_fechou',
  'em_andamento',
]);

export const emailSchema = z
  .string()
  .trim()
  .email('E-mail inválido.')
  .or(z.literal(''));

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'E-mail inválido.',
  });

export const cpfSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || isValidCpf(v), {
    message: 'CPF inválido.',
  });

export const nonNegNumber = z
  .number({ error: 'Número inválido.' })
  .finite()
  .min(0, 'Valor não pode ser negativo.');

export const optionalNonNeg = z
  .number()
  .finite()
  .min(0, 'Valor não pode ser negativo.')
  .optional()
  .nullable();

export const isoDateOptional = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Data inválida (use AAAA-MM-DD).',
  });
