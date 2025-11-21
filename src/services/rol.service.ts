import { prisma } from '../config/database';
import { bitacoraService, TipoEntidad, AccionBitacora } from './bitacora.service';
import type {
  RegistrarRolResult,
  ListarRolesPaginadoResult,
  ObtenerRolResult,
  ActualizarRolResult,
  EliminarRolResult,
  AsignarPermisosRolResult,
} from '../types/stored-procedures';

export class RolService {
  /**
   * Registrar un nuevo rol
   */
  async registrarRol(data: {
    nombreRol: string;
    descripcion?: string | null;
    idUsuarioRegistro?: number;
    ipAddress?: string;
  }): Promise<{ id_rol: number; mensaje: string }> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_registrar_rol
        @nombreRol = '${data.nombreRol}',
        @descripcion = ${data.descripcion ? `'${data.descripcion}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al registrar rol');
    }

    await bitacoraService.registrarCreacion({
      tipoEntidad: TipoEntidad.ROL,
      idEntidad: result[0].id_rol!,
      idUsuario: data.idUsuarioRegistro,
      descripcion: `Rol creado: ${data.nombreRol}`,
      ipAddress: data.ipAddress
    });

    return {
      id_rol: result[0].id_rol!,
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Listar roles con paginación
   */
  async listarRoles(params: {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    soloActivos?: boolean;
  }): Promise<{
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
    roles: any[];
  }> {
    const pagina = params.pagina || 1;
    const limite = params.limite || 10;
    const busqueda = params.busqueda || null;
    const soloActivos = params.soloActivos !== undefined ? (params.soloActivos ? 1 : 0) : 1;

    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_listar_roles_paginado
        @pagina = ${pagina},
        @limite = ${limite},
        @busqueda = ${busqueda ? `'${busqueda}'` : 'NULL'},
        @soloActivos = ${soloActivos}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener roles');
    }

    const roles = result[0].roles ? JSON.parse(result[0].roles) : [];

    return {
      total: result[0].total,
      pagina: result[0].pagina,
      limite: result[0].limite,
      total_paginas: result[0].total_paginas,
      roles,
    };
  }

  /**
   * Obtener un rol por ID con sus permisos
   */
  async obtenerRol(idRol: number): Promise<any> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_obtener_rol @idRol = ${idRol}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Rol no encontrado');
    }

    const rol = result[0];
    const permisos = rol.permisos ? JSON.parse(rol.permisos) : [];

    return {
      ...rol,
      permisos,
    };
  }

  /**
   * Actualizar un rol
   */
  async actualizarRol(
    idRol: number,
    data: {
      nombreRol: string;
      descripcion?: string | null;
      activo: boolean;
    }
  ): Promise<{ mensaje: string }> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_actualizar_rol
        @idRol = ${idRol},
        @nombreRol = '${data.nombreRol}',
        @descripcion = ${data.descripcion ? `'${data.descripcion}'` : 'NULL'},
        @activo = ${data.activo ? 1 : 0}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al actualizar rol');
    }

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Eliminar un rol (soft delete)
   */
  async eliminarRol(idRol: number): Promise<{ mensaje: string }> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_eliminar_rol @idRol = ${idRol}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al eliminar rol');
    }

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Asignar permisos a un rol
   */
  async asignarPermisos(idRol: number, permisos: number[], idUsuario?: number, ipAddress?: string): Promise<{ mensaje: string }> {
    const rol = await this.obtenerRol(idRol);
    const permisosJson = JSON.stringify(permisos);

    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_asignar_permisos_rol
        @idRol = ${idRol},
        @permisos = '${permisosJson}'`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al asignar permisos');
    }

    await bitacoraService.registrarAccion({
      tipoEntidad: TipoEntidad.ROL,
      idEntidad: idRol,
      idUsuario,
      accion: AccionBitacora.GRANT_PERMISSION,
      descripcion: `Permisos asignados al rol: ${rol.nombre_rol}`,
      ipAddress,
      detalles: { permisos: permisos.map(String), metadata: { cantidadPermisos: permisos.length } }
    });

    return {
      mensaje: result[0].mensaje,
    };
  }
}
