import { InChurchApiError } from './types'

export class InChurchError extends Error implements InChurchApiError {
  public code: string
  public status?: number
  public details?: unknown

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message)
    this.name = 'InChurchError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function createInChurchError(
  status: number,
  responseBody?: unknown
): InChurchError {
  switch (status) {
    case 400:
      return new InChurchError(
        'Requisição inválida',
        'BAD_REQUEST',
        status,
        responseBody
      )
    case 401:
      return new InChurchError(
        'Credenciais inválidas ou expiradas',
        'UNAUTHORIZED',
        status,
        responseBody
      )
    case 403:
      return new InChurchError(
        'Acesso negado',
        'FORBIDDEN',
        status,
        responseBody
      )
    case 404:
      return new InChurchError(
        'Recurso não encontrado',
        'NOT_FOUND',
        status,
        responseBody
      )
    case 429:
      return new InChurchError(
        'Limite de requisições excedido',
        'RATE_LIMIT_EXCEEDED',
        status,
        responseBody
      )
    case 500:
      return new InChurchError(
        'Erro interno do servidor InChurch',
        'INTERNAL_SERVER_ERROR',
        status,
        responseBody
      )
    default:
      return new InChurchError(
        `Erro HTTP ${status}`,
        'HTTP_ERROR',
        status,
        responseBody
      )
  }
}