import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres.'),
});

export const registerSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres.'),
});

export const recoverSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirmação obrigatória.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export const adminInviteSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  nome: z.string().trim().optional().nullable(),
  ativo: z.boolean().optional(),
});
