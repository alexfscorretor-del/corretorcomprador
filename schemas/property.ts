import { z } from 'zod';
import { optionalNonNeg } from './common';

const simNaoEmpty = z.enum(['sim', 'nao', '']);

export const propertyFormSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, 'Cliente obrigatório.'),
  createdAt: z.string().optional(),
  titulo: z.string().trim().min(1, 'Título é obrigatório.'),
  tipoImovel: z.string().default(''),
  preco: z
    .number({ error: 'Preço inválido.' })
    .finite()
    .min(0, 'Preço não pode ser negativo.'),
  bairro: z.string().default(''),
  descricao: z.string().optional(),
  tamanho: optionalNonNeg,
  quartos: optionalNonNeg,
  suites: optionalNonNeg,
  banheiros: optionalNonNeg,
  vagas: optionalNonNeg,
  andar: z.number().int().nullable().optional(),
  tipoVaga: z.string().optional(),
  tipoVagaCobertura: z.enum(['coberta', 'descoberta', '']).optional(),
  tipoVagaModelo: z.enum(['individual', 'gaveta', '']).optional(),
  condominio: optionalNonNeg,
  predioNovo: simNaoEmpty.optional(),
  reformado: simNaoEmpty.optional(),
  aceitaFinanciamento: simNaoEmpty.optional(),
  mobiliado: z.boolean().default(false),
  varanda: z.boolean().default(false),
  areaLazer: z.boolean().default(false),
  aceitaPet: z.boolean().default(false),
  link: z.string().optional(),
  fotos: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  favorito: z.boolean().optional(),
  status: z.enum(['disponivel', 'vendido', 'alugado']).optional(),
  observacoes: z.string().optional(),
  anotacaoPrivada: z.string().optional(),
});

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;
