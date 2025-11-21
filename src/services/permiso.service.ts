import { prisma } from '../config/database';
import { bitacoraService, TipoEntidad } from './bitacora.service';
import type {
  RegistrarPermisoResult,
  ListarPermisosResult,
  ObtenerPermisoResult,
  ActualizarPermisoResult,
  EliminarPermisoResult,
  ListarTodosPermisosResult,
} from '../types/stored-procedures';

export class PermisoService {
  /**
   * Registrar un nuevo permiso
   */
  async registrarPermiso(data: {
    nombrePermiso: string;
    descripcion?: string | null;
    modulo?: string | null;
    idUsuarioRegistro?: number |null;
    ipAddress?: string;
  }): Promise<{ id_permiso: number; mensaje: string }> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_registrar_permiso
        @nombrePermiso = '${data.nombrePermiso}',
        @descripcion = ${data.descripcion ? `'${data.descripcion}'` : 'NULL'},
        @modulo = ${data.modulo ? `'${data.modulo}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al registrar permiso');
    }

    await bitacoraService.registrarCreacion({
      tipoEntidad: TipoEntidad.PERMISO,
      idEntidad: result[0].id_permiso!,
      idUsuario: data.idUsuarioRegistro,
      descripcion: `Permiso creado: ${data.nombrePermiso}`,
      ipAddress: data.ipAddress,
      detalles: { modulo: data.modulo }
    });

    return {
      id_permiso: result[0].id_permiso!,
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Listar permisos con paginación
   */
  async listarPermisos(params: {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    modulo?: string;
  }): Promise<{
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
    permisos: any[];
  }> {
    const pagina = params.pagina || 1;
    const limite = params.limite || 10;
    const busqueda = params.busqueda || null;
    const modulo = params.modulo || null;

    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_listar_permisos
        @pagina = ${pagina},
        @limite = ${limite},
        @busqueda = ${busqueda ? `'${busqueda}'` : 'NULL'},
        @modulo = ${modulo ? `'${modulo}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener permisos');
    }

    const permisos = result[0].permisos ? JSON.parse(result[0].permisos) : [];

    return {
      total: result[0].total,
      pagina: result[0].pagina,
      limite: result[0].limite,
      total_paginas: result[0].total_paginas,
      permisos,
    };
  }

  /**
   * Listar todos los permisos (sin paginación)
   */
  async listarTodosPermisos(): Promise<any[]> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_listar_todos_permisos`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener permisos');
    }

    const permisos = result[0].permisos ? JSON.parse(result[0].permisos) : [];
    return permisos;
  }

  /**
   * Obtener un permiso por ID
   */
  async obtenerPermiso(idPermiso: number): Promise<any> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_obtener_permiso @idPermiso = ${idPermiso}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Permiso no encontrado');
    }

    return result[0];
  }

  /**
   * Actualizar un permiso
   */
  async actualizarPermiso(
    idPermiso: number,
    data: {
      nombrePermiso: string;
      descripcion?: string | null;
      modulo?: string | null;
    }
  ): Promise<{ mensaje: string }> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_actualizar_permiso
        @idPermiso = ${idPermiso},
        @nombrePermiso = '${data.nombrePermiso}',
        @descripcion = ${data.descripcion ? `'${data.descripcion}'` : 'NULL'},
        @modulo = ${data.modulo ? `'${data.modulo}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al actualizar permiso');
    }

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Eliminar un permiso (soft delete)
   */
  async eliminarPermiso(idPermiso: number): Promise<{ mensaje: string }> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_eliminar_permiso @idPermiso = ${idPermiso}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al eliminar permiso');
    }

    return {
      mensaje: result[0].mensaje,
    };
  }
}
