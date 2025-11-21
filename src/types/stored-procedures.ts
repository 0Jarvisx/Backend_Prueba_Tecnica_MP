// Tipos para resultados de procedimientos almacenados

export interface LoginUsuarioResult {
  resultado: number;
  mensaje: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  dpi: string | null;
  telefono: string | null;
  id_rol: number;
  nombre_rol: string;
  rol_descripcion: string | null;
  activo: boolean;
  requiere_cambio_password: boolean;
  permisos: string | null; // JSON string
  created_at: Date;
  updated_at: Date;
}

export interface ObtenerPerfilResult {
  resultado: number;
  mensaje: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  dpi: string | null;
  telefono: string | null;
  activo: boolean;
  id_rol: number;
  nombre_rol: string;
  rol_descripcion: string | null;
  created_at: Date;
  updated_at: Date;
  permisos: string | null; // JSON string
}

export interface ActualizarPerfilResult {
  resultado: number;
  mensaje: string;
  id_usuario?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string | null;
  nombre_rol?: string;
}

export interface CambiarPasswordResult {
  resultado: number;
  mensaje: string;
}

export interface SolicitarResetResult {
  resultado: number;
  mensaje: string;
  id_usuario: number | null;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
}

export interface ResetearPasswordResult {
  resultado: number;
  mensaje: string;
}

// Interfaces para CRUD de usuarios
export interface RegistrarUsuarioResult {
  resultado: number;
  mensaje: string;
  id_usuario: number | null;
}

export interface ListarUsuariosResult {
  resultado: number;
  mensaje: string;
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  usuarios: string | null; // JSON string
}

export interface ObtenerUsuarioResult {
  resultado: number;
  mensaje: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  dpi: string | null;
  telefono: string | null;
  activo: boolean;
  id_rol: number;
  nombre_rol: string;
  rol_descripcion: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ActualizarUsuarioResult {
  resultado: number;
  mensaje: string;
  id_usuario?: number;
}

export interface EliminarUsuarioResult {
  resultado: number;
  mensaje: string;
}

export interface ListarRolesResult {
  resultado: number;
  mensaje: string;
  roles: string | null; // JSON string
}

// ==================== CRUD DE ROLES ====================

export interface RegistrarRolResult {
  resultado: number;
  mensaje: string;
  id_rol: number | null;
}

export interface ListarRolesPaginadoResult {
  resultado: number;
  mensaje: string;
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  roles: string | null; // JSON string
}

export interface ObtenerRolResult {
  resultado: number;
  mensaje: string;
  id_rol: number;
  nombre_rol: string;
  descripcion: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  permisos: string | null; // JSON string con los permisos del rol
}

export interface ActualizarRolResult {
  resultado: number;
  mensaje: string;
  id_rol?: number;
}

export interface EliminarRolResult {
  resultado: number;
  mensaje: string;
}

export interface AsignarPermisosRolResult {
  resultado: number;
  mensaje: string;
}

// ==================== CRUD DE PERMISOS ====================

export interface RegistrarPermisoResult {
  resultado: number;
  mensaje: string;
  id_permiso: number | null;
}

export interface ListarPermisosResult {
  resultado: number;
  mensaje: string;
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  permisos: string | null; // JSON string
}

export interface ObtenerPermisoResult {
  resultado: number;
  mensaje: string;
  id_permiso: number;
  nombre_permiso: string;
  descripcion: string | null;
  modulo: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ActualizarPermisoResult {
  resultado: number;
  mensaje: string;
  id_permiso?: number;
}

export interface EliminarPermisoResult {
  resultado: number;
  mensaje: string;
}

export interface ListarTodosPermisosResult {
  resultado: number;
  mensaje: string;
  permisos: string | null; // JSON string
}

// ==================== EXPEDIENTES ====================

export interface CrearExpedienteResult {
  resultado: number;
  mensaje: string;
  id_expediente: number | null;
}

export interface ListarExpedientesResult {
  resultado: number;
  mensaje: string;
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  expedientes: string | null; // JSON string
}

export interface ObtenerExpedienteResult {
  resultado: number;
  mensaje: string;
  id_expediente?: number;
  numero_expediente?: string;
  numero_caso_mp?: string | null;
  fecha_registro?: Date;
  id_usuario_registro?: number;
  usuario_registro_nombre?: string;
  usuario_registro_apellido?: string;
  usuario_registro_email?: string;
  id_tecnico_asignado?: number;
  tecnico_nombre?: string;
  tecnico_apellido?: string;
  tecnico_email?: string;
  id_supervisor?: number | null;
  supervisor_nombre?: string | null;
  supervisor_apellido?: string | null;
  supervisor_email?: string | null;
  id_fiscalia?: number;
  fiscalia_nombre?: string;
  fiscalia_codigo?: string;
  fiscalia_direccion?: string | null;
  fiscalia_telefono?: string | null;
  id_unidad?: number;
  nombre_unidad?: string;
  codigo_unidad?: string;
  especialidad?: string | null;
  id_estado?: number;
  nombre_estado?: string;
  estado_descripcion?: string | null;
  estado_color?: string | null;
  tipo_analisis?: string | null;
  fiscal_solicitante?: string | null;
  oficio_solicitud?: string | null;
  urgencia?: string | null;
  fecha_limite?: Date | null;
  tipo_delito?: string | null;
  lugar_hecho?: string | null;
  fecha_hecho?: Date | null;
  descripcion_caso?: string | null;
  fecha_inicio_analisis?: Date | null;
  fecha_entrega_dictamen?: Date | null;
  observaciones?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ActualizarExpedienteResult {
  resultado: number;
  mensaje: string;
}

export interface EliminarExpedienteResult {
  resultado: number;
  mensaje: string;
}

export interface AprobarExpedienteResult {
  resultado: number;
  mensaje: string;
}

export interface RechazarExpedienteResult {
  resultado: number;
  mensaje: string;
  tecnico_email: string | null;
  tecnico_nombre: string | null;
  numero_expediente: string | null;
  motivo_rechazo?: string | null;
}

// ==================== INDICIOS ====================

export interface CrearIndicioResult {
  resultado: number;
  mensaje: string;
  id_indicio: number | null;
}

export interface ListarIndiciosResult {
  resultado: number;
  mensaje: string;
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  indicios: string | null; // JSON string
}

export interface ObtenerIndicioResult {
  resultado: number;
  mensaje: string;
  id_indicio?: number;
  id_expediente?: number;
  numero_expediente?: string;
  numero_caso_mp?: string | null;
  numero_indicio?: string;
  descripcion?: string;
  tipo_objeto?: string | null;
  color?: string | null;
  tamanio?: string | null;
  peso?: number | null;
  peso_unidad?: string | null;
  ubicacion_hallazgo?: string | null;
  id_tecnico_registro?: number;
  tecnico_nombre?: string;
  tecnico_apellido?: string;
  tecnico_email?: string;
  fecha_registro?: Date;
  id_estado_indicio?: number;
  estado_nombre?: string;
  estado_descripcion?: string | null;
  observaciones?: string | null;
  cantidad?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ActualizarIndicioResult {
  resultado: number;
  mensaje: string;
}

export interface EliminarIndicioResult {
  resultado: number;
  mensaje: string;
}
