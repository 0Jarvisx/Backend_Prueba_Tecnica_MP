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
