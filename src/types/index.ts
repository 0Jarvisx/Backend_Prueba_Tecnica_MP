// Tipos de respuesta API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Tipos de autenticación
export interface JwtPayload {
  id: number;
  email: string;
  rol: string;
  idRol: number;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Permiso {
  id_permiso: number;
  nombre_permiso: string;
  descripcion: string | null;
  modulo: string | null;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
    permisos: Permiso[];
  };
  requiereCambioPassword: boolean;
}

// Tipos de filtros y búsqueda
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpedienteFilters extends PaginationQuery {
  estado?: string;
  idFiscalia?: number;
  idUnidad?: number;
  idTecnicoAsignado?: number;
  urgencia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}

export interface IndicioFilters extends PaginationQuery {
  idExpediente?: number;
  tipoObjeto?: string;
  idEstadoIndicio?: number;
}

// Tipos de cadena de custodia
export type AccionCustodia =
  | 'recepcion'
  | 'traslado'
  | 'analisis'
  | 'almacenamiento'
  | 'devolucion'
  | 'destruccion';

// Tipos de urgencia
export type Urgencia = 'ordinario' | 'urgente' | 'muy_urgente';

// Tipos de documento
export type TipoDocumento = 'dictamen' | 'foto' | 'oficio' | 'informe' | 'otro';

// Constantes de roles
export const ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TECNICO: 'TECNICO',
  RECEPCION: 'RECEPCION',
  CONSULTA: 'CONSULTA'
} as const;

export type RolType = typeof ROLES[keyof typeof ROLES];

// Constantes de estados de expediente
export const ESTADOS_EXPEDIENTE = {
  EN_COLA: 'En Cola',
  EN_PROCESO: 'En Proceso',
  EN_REVISION: 'En Revisión',
  RECHAZADO: 'Rechazado',
  APROBADO: 'Aprobado',
  FINALIZADO: 'Finalizado'
} as const;

export type EstadoExpedienteType = typeof ESTADOS_EXPEDIENTE[keyof typeof ESTADOS_EXPEDIENTE];

// Constantes de estados de indicio
export const ESTADOS_INDICIO = {
  REGISTRADO: 'Registrado',
  EN_ANALISIS: 'En Análisis',
  ANALIZADO: 'Analizado',
  DEVUELTO: 'Devuelto',
  DESTRUIDO: 'Destruido'
} as const;

export type EstadoIndicioType = typeof ESTADOS_INDICIO[keyof typeof ESTADOS_INDICIO];

// Tipos de Bitácora y Auditoría
export { TipoEntidad, AccionBitacora } from '../services/bitacora.service';
export type { RegistroBitacoraData, FiltrosBitacora } from '../services/bitacora.service';
