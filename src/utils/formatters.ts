import { ApiResponse, PaginationInfo } from '../types';

/**
 * Formatea respuesta exitosa de la API
 */
export function successResponse<T>(
  data: T,
  message?: string,
  pagination?: PaginationInfo
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    pagination
  };
}

/**
 * Formatea respuesta de error de la API
 */
export function errorResponse(
  message: string,
  errors?: string[]
): ApiResponse {
  return {
    success: false,
    message,
    errors
  };
}

/**
 * Calcula información de paginación
 */
export function getPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Genera número de expediente único
 * Formato: DICRI-YYYY-NNNNN
 */
export function generateNumeroExpediente(correlativo: number): string {
  const year = new Date().getFullYear();
  const numero = correlativo.toString().padStart(5, '0');
  return `DICRI-${year}-${numero}`;
}

/**
 * Genera código de indicio
 * Formato: IND-EXPEDIENTE-NN
 */
export function generateCodigoIndicio(
  numeroExpediente: string,
  correlativo: number
): string {
  const numero = correlativo.toString().padStart(2, '0');
  return `IND-${numeroExpediente}-${numero}`;
}

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Formatea fecha para mostrar
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatea fecha y hora para mostrar
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
