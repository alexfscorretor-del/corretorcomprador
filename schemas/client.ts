import { z } from 'zod';
import {
  businessStatusSchema,
  cpfSchema,
  isoDateOptional,
  optionalEmailSchema,
  optionalNonNeg,
  triStateSchema,
} from './common';
import { isPriceRangeValid } from '@/validators/ranges';

export const clientFormSchema = z
  .object({
    id: z.string().optional(),
    createdAt: z.string().optional(),
    nome: z.string().trim().min(1, 'Nome é obrigatório.'),
    telefone: z
      .string()
      .trim()
      .min(1, 'Telefone é obrigatório.')
      .refine((v) => v.replace(/\D/g, '').length >= 10, {
        message: 'Telefone deve ter ao menos 10 dígitos.',
      }),
    email: optionalEmailSchema.default(''),
    cpf: cpfSchema.default(''),
    aniversario: isoDateOptional.optional().or(z.literal('')),
    sexo: z.string().optional(),
    estadoCivil: z.string().optional(),
    temFilhos: z.boolean().default(false),
    quantFilhos: z.number().int().min(0).default(0),
    prazo: isoDateOptional.optional().or(z.literal('')),
    tipoImovel: z.union([z.string(), z.array(z.string())]).optional(),
    precoMin: optionalNonNeg,
    precoMax: optionalNonNeg,
    orcamentoMin: optionalNonNeg,
    orcamentoMax: optionalNonNeg,
    bairro: z.string().optional(),
    bairrosSecundarios: z.string().optional(),
    tamanho: optionalNonNeg,
    quartosMin: optionalNonNeg,
    suitesMin: optionalNonNeg,
    banheirosMin: optionalNonNeg,
    vagasMin: optionalNonNeg,
    tipoVaga: z.string().optional(),
    condominioMax: optionalNonNeg,
    prefAndar: z.boolean().default(false),
    andarApartir: z.number().int().min(0).nullable().optional(),
    novo: triStateSchema.default('indiferente'),
    reformado: triStateSchema.default('indiferente'),
    aceitaFinanciamento: triStateSchema.default('indiferente'),
    mobiliado: triStateSchema.default('indiferente'),
    varanda: triStateSchema.default('indiferente'),
    areaLazer: triStateSchema.default('indiferente'),
    aceitaPet: triStateSchema.default('indiferente'),
    statusNegocio: businessStatusSchema.default('em_andamento'),
    observacoes: z.string().optional(),
    archived: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const min = data.precoMin ?? data.orcamentoMin ?? null;
    const max = data.precoMax ?? data.orcamentoMax ?? null;
    if (!isPriceRangeValid(min, max)) {
      ctx.addIssue({
        code: 'custom',
        path: ['precoMax'],
        message: 'Preço máximo deve ser maior ou igual ao mínimo.',
      });
    }
  });

export type ClientFormInput = z.infer<typeof clientFormSchema>;
