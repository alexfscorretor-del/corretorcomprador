export type AppErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UPLOAD'
  | 'EXTERNAL'
  | 'INTERNAL';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; cause?: unknown }
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status =
      options?.status ??
      (code === 'VALIDATION'
        ? 400
        : code === 'UNAUTHORIZED'
          ? 401
          : code === 'FORBIDDEN'
            ? 403
            : code === 'NOT_FOUND'
              ? 404
              : code === 'CONFLICT'
                ? 409
                : 500);
    this.details = options?.details;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/** Mensagem segura para UI a partir de erro desconhecido. */
export function getErrorMessage(err: unknown, fallback = 'Erro inesperado.'): string {
  if (isAppError(err)) return err.message;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

/** Normaliza erros Zod-like { issues: [{ message }] }. */
export function validationErrorFromZod(err: {
  issues?: ReadonlyArray<{ path?: readonly PropertyKey[]; message: string }>;
  message?: string;
}): AppError {
  const issues = err.issues ?? [];
  const message =
    issues.length > 0
      ? issues
          .map((i) => {
            const path = i.path?.length
              ? `${i.path.map(String).join('.')}: `
              : '';
            return `${path}${i.message}`;
          })
          .join('; ')
      : err.message || 'Dados inválidos.';

  return new AppError('VALIDATION', message, { details: issues });
}
