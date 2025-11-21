import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { environment } from '../config/environment';
import { emailService } from './email.service';
import { bitacoraService, TipoEntidad } from './bitacora.service';
import logger from '../utils/logger';
import { generateRandomPassword } from '../utils/passwordGenerator';
import type {
  RegistrarUsuarioResult,
  ListarUsuariosResult,
  ObtenerUsuarioResult,
  ActualizarUsuarioResult,
  EliminarUsuarioResult,
  ListarRolesResult,
} from '../types/stored-procedures';

export class UserService {
  /**
   * Registrar un nuevo usuario
   */
  async registrarUsuario(data: {
    nombre: string;
    apellido: string;
    email: string;
    dpi?: string | null;
    telefono?: string | null;
    idRol: number;
    idUsuarioRegistro: number;
    ipAddress?: string;
  }): Promise<{ id_usuario: number; mensaje: string }> {
    // Generar contraseña aleatoria
    const generatedPassword = generateRandomPassword(12);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(generatedPassword, environment.bcryptSaltRounds);

    // Llamar al procedimiento almacenado
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_registrar_usuario
        @nombre = '${data.nombre}',
        @apellido = '${data.apellido}',
        @email = '${data.email}',
        @password = '${hashedPassword}',
        @dpi = ${data.dpi ? `'${data.dpi}'` : 'NULL'},
        @telefono = ${data.telefono ? `'${data.telefono}'` : 'NULL'},
        @idRol = ${data.idRol}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al registrar usuario');
    }

    // Obtener información del rol para el email
    try {
      const roles = await this.listarRoles();
      const rol = roles.find((r: any) => r.id_rol === data.idRol);
      const roleName = rol?.nombre_rol || 'Usuario';

      // Enviar email de bienvenida de forma asíncrona (no bloquea la respuesta)
      emailService.sendWelcomeEmail(
        data.email,
        data.nombre,
        data.apellido,
        roleName,
        generatedPassword
      ).catch(error => {
        logger.error('Error al enviar email de bienvenida:', error);
      });

      // Registrar en bitácora
      await bitacoraService.registrarCreacion({
        tipoEntidad: TipoEntidad.USUARIO,
        idEntidad: result[0].id_usuario!,
        idUsuario: data.idUsuarioRegistro,
        descripcion: `Usuario creado: ${data.email} (${data.nombre} ${data.apellido})`,
        ipAddress: data.ipAddress,
        detalles: {
          email: data.email,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: roleName,
          dpi: data.dpi
        }
      });
    } catch (error) {
      logger.error('Error al obtener rol para email de bienvenida:', error);
    }

    return {
      id_usuario: result[0].id_usuario!,
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Listar usuarios con paginación
   */
  async listarUsuarios(params: {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    idRol?: number;
    soloActivos?: boolean;
  }): Promise<{
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
    usuarios: any[];
  }> {
    const pagina = params.pagina || 1;
    const limite = params.limite || 10;
    const busqueda = params.busqueda || null;
    const idRol = params.idRol || null;
    const soloActivos = params.soloActivos !== undefined ? (params.soloActivos ? 1 : 0) : 1;

    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_listar_usuarios
        @pagina = ${pagina},
        @limite = ${limite},
        @busqueda = ${busqueda ? `'${busqueda}'` : 'NULL'},
        @idRol = ${idRol || 'NULL'},
        @soloActivos = ${soloActivos}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener usuarios');
    }

    const usuarios = result[0].usuarios ? JSON.parse(result[0].usuarios) : [];

    return {
      total: result[0].total,
      pagina: result[0].pagina,
      limite: result[0].limite,
      total_paginas: result[0].total_paginas,
      usuarios,
    };
  }

  /**
   * Obtener un usuario por ID
   */
  async obtenerUsuario(idUsuario: number): Promise<any> {
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_obtener_usuario @idUsuario = ${idUsuario}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Usuario no encontrado');
    }

    return result[0];
  }

  /**
   * Actualizar un usuario
   */
  async actualizarUsuario(
    idUsuario: number,
    data: {
      nombre: string;
      apellido: string;
      email: string;
      dpi?: string | null;
      telefono?: string | null;
      idRol: number;
      activo: boolean;
      idUsuarioModificador: number;
      ipAddress?: string;
    }
  ): Promise<{ mensaje: string }> {
    // Obtener datos anteriores
    const usuarioAnterior = await this.obtenerUsuario(idUsuario);
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_actualizar_usuario
        @idUsuario = ${idUsuario},
        @nombre = '${data.nombre}',
        @apellido = '${data.apellido}',
        @email = '${data.email}',
        @dpi = ${data.dpi ? `'${data.dpi}'` : 'NULL'},
        @telefono = ${data.telefono ? `'${data.telefono}'` : 'NULL'},
        @idRol = ${data.idRol},
        @activo = ${data.activo ? 1 : 0}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al actualizar usuario');
    }

    // Detectar cambios para registrar en bitácora
    const cambios: string[] = [];
    if (usuarioAnterior.nombre !== data.nombre) cambios.push('nombre');
    if (usuarioAnterior.apellido !== data.apellido) cambios.push('apellido');
    if (usuarioAnterior.email !== data.email) cambios.push('email');
    if (usuarioAnterior.id_rol !== data.idRol) cambios.push('rol');
    if (usuarioAnterior.activo !== data.activo) cambios.push('estado');

    if (cambios.length > 0) {
      await bitacoraService.registrarActualizacion({
        tipoEntidad: TipoEntidad.USUARIO,
        idEntidad: idUsuario,
        idUsuario: data.idUsuarioModificador,
        descripcion: `Usuario actualizado: ${data.email}`,
        ipAddress: data.ipAddress,
        camposActualizados: cambios,
        valoresAnteriores: {
          nombre: usuarioAnterior.nombre,
          apellido: usuarioAnterior.apellido,
          email: usuarioAnterior.email,
          rol: usuarioAnterior.nombre_rol,
          activo: usuarioAnterior.activo
        },
        valoresNuevos: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          activo: data.activo
        }
      });
    }

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Eliminar un usuario (soft delete)
   */
  async eliminarUsuario(idUsuario: number, idUsuarioEliminador: number, ipAddress?: string): Promise<{ mensaje: string }> {
    // Obtener datos del usuario antes de eliminar
    const usuario = await this.obtenerUsuario(idUsuario);
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_eliminar_usuario @idUsuario = ${idUsuario}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al eliminar usuario');
    }

    // Registrar en bitácora
    await bitacoraService.registrarEliminacion({
      tipoEntidad: TipoEntidad.USUARIO,
      idEntidad: idUsuario,
      idUsuario: idUsuarioEliminador,
      descripcion: `Usuario eliminado: ${usuario.email} (${usuario.nombre} ${usuario.apellido})`,
      ipAddress,
      detalles: {
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.nombre_rol
      }
    });

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Listar roles activos
   */
  async listarRoles(): Promise<any[]> {
    const result:any = await prisma.$queryRawUnsafe(`EXEC pr_listar_roles`);

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener roles');
    }

    const roles = result[0].roles ? JSON.parse(result[0].roles) : [];
    return roles;
  }
}
