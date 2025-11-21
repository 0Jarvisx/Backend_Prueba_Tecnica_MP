import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { environment } from '../config/environment';
import { generateToken, verifyToken } from '../utils/jwt';
import { JwtPayload, LoginResponse } from '../types';
import {
  LoginUsuarioResult,
  ObtenerPerfilResult,
  ActualizarPerfilResult,
  CambiarPasswordResult,
  SolicitarResetResult,
  ResetearPasswordResult
} from '../types/stored-procedures';
import { emailService } from './email.service';
import { bitacoraService } from './bitacora.service';
import logger from '../utils/logger';

export class AuthService {
  /**
   * Login de usuario
   */
  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      // Ejecutar procedimiento almacenado
      const escapedEmail = email.replace(/'/g, "''");
      const result:any = await prisma.$queryRawUnsafe(
        `EXEC pr_login_usuario @email = N'${escapedEmail}'`
      );

      // Validar que se obtuvo un resultado
      if (!result || result.length === 0) throw new Error('Credenciales inválidas');
      
      const usuario = result[0];

      // Verificar el resultado del procedimiento almacenado
      if (usuario.resultado === 0) {
        throw new Error(usuario.mensaje || 'Credenciales inválidas');
      }

      const isValidPassword = await bcrypt.compare(password, usuario.password);
      logger.info(`Resultado de comparación: ${isValidPassword}`);

      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Generar token JWT
      const token = generateToken({
        id: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.nombre_rol,
        idRol: usuario.id_rol
      });

      // Parsear permisos JSON - retornar objeto completo con id, nombre, descripcion y modulo
      let permisos: { id_permiso: number; nombre_permiso: string; descripcion: string | null; modulo: string | null }[] = [];
      if (usuario.permisos) {
        try {
          permisos = JSON.parse(usuario.permisos);
        } catch (error) {
          logger.error('Error al parsear permisos JSON:', error);
        }
      }

      logger.info(`Usuario ${usuario.email} inició sesión`);

      // Registrar login en bitácora
      await bitacoraService.registrarLogin({
        idUsuario: usuario.id_usuario,
        email: usuario.email,
        ipAddress,
        userAgent
      });

      return {
        token,
        user: {
          id: usuario.id_usuario,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.nombre_rol,
          permisos
        },
        requiereCambioPassword: usuario.requiere_cambio_password
      };
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    dpi?: string;
    telefono?: string;
    idRol: number;
  }): Promise<{ id: number; email: string }> {
    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Verificar si el DPI ya existe
    if (data.dpi) {
      const existingDpi = await prisma.usuario.findUnique({
        where: { dpi: data.dpi }
      });

      if (existingDpi) {
        throw new Error('El DPI ya está registrado');
      }
    }

    // Verificar que el rol existe
    const rol = await prisma.rol.findUnique({
      where: { id: data.idRol, deletedAt: null }
    });

    if (!rol) {
      throw new Error('Rol no válido');
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(data.password, environment.bcryptSaltRounds);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nombre: data.nombre,
        apellido: data.apellido,
        dpi: data.dpi,
        telefono: data.telefono,
        idRol: data.idRol,
        activo: true
      }
    });

    logger.info(`Nuevo usuario registrado: ${usuario.email}`);

    return {
      id: usuario.id,
      email: usuario.email
    };
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    // Primero obtener el usuario para validar la contraseña actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Validar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, usuario.password);
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, environment.bcryptSaltRounds);

    // Ejecutar procedimiento almacenado
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_cambiar_password_usuario @idUsuario = ${userId}, @passwordNuevo = '${hashedPassword}'`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al cambiar contraseña');
    }

    logger.info(`Usuario ${usuario.email} cambió su contraseña`);

    // Registrar cambio de contraseña en bitácora
    await bitacoraService.registrarCambioPassword({
      idUsuario: userId,
      email: usuario.email,
      ipAddress,
      esPrimerCambio: usuario.requiereCambioPassword
    });
  }

  /**
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(email: string): Promise<string> {
    // Ejecutar procedimiento almacenado
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_solicitar_reset_password @email = '${email}'`
    );

    if (!result || result.length === 0) {
      throw new Error('Error al procesar la solicitud');
    }

    const data = result[0];

    // Si el usuario existe
    if (data.id_usuario && data.nombre && data.apellido && data.email) {
      // Generar token de reset (expira en 1 hora)
      const resetToken = generateToken({
        id: data.id_usuario,
        email: data.email,
        rol: 'RESET_PASSWORD',
        idRol: 0
      });

      // Enviar email con el token
      const userName = `${data.nombre} ${data.apellido}`;
      const emailSent = await emailService.sendPasswordResetEmail(
        data.email,
        userName,
        resetToken
      );

      if (emailSent) {
        logger.info(`Email de reset de contraseña enviado a: ${email}`);
      } else {
        logger.error(`Error al enviar email de reset a: ${email}`);
        // No lanzar error para no revelar si el email existe
      }

      return resetToken;
    }

    logger.info(`Solicitud de reset para email no registrado: ${email}`);
    return 'token-dummy';
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: JwtPayload;

    try {
      payload = verifyToken(token);
    } catch {
      throw new Error('Token inválido o expirado');
    }

    if (payload.rol !== 'RESET_PASSWORD') {
      throw new Error('Token no válido para reset de contraseña');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, environment.bcryptSaltRounds);

    // Ejecutar procedimiento almacenado
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_resetear_password @email = '${payload.email}', @passwordNuevo = '${hashedPassword}'`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al resetear contraseña');
    }

    logger.info(`Contraseña reseteada para: ${payload.email}`);
  }

  /**
   * Refrescar token
   */
  async refreshToken(token: string): Promise<string> {
    let payload: JwtPayload;

    try {
      payload = verifyToken(token);
    } catch {
      throw new Error('Token inválido o expirado');
    }

    // Verificar que el usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id, deletedAt: null },
      include: { rol: true }
    });

    if (!usuario || !usuario.activo) {
      throw new Error('Usuario no válido');
    }

    const newToken = generateToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol.nombreRol,
      idRol: usuario.idRol
    });

    return newToken;
  }

  /**
   * Obtener perfil del usuario
   */
  async getProfile(userId: number) {
    // Ejecutar procedimiento almacenado
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_obtener_perfil_usuario @idUsuario = ${userId}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Usuario no encontrado');
    }

    const usuario = result[0];

    // Parsear permisos JSON
    let permisos: string[] = [];
    if (usuario.permisos) {
      try {
        const permisosArray = JSON.parse(usuario.permisos);
        permisos = permisosArray.map((p: any) => p.nombre_permiso);
      } catch (error) {
        logger.error('Error al parsear permisos JSON:', error);
      }
    }

    return {
      id: usuario.id_usuario,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dpi: usuario.dpi,
      telefono: usuario.telefono,
      rol: usuario.nombre_rol,
      permisos
    };
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(
    userId: number,
    data: {
      nombre?: string;
      apellido?: string;
      telefono?: string;
    }
  ) {
    // Obtener datos actuales si no se proporcionan
    const currentUser = await prisma.usuario.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!currentUser) {
      throw new Error('Usuario no encontrado');
    }

    const nombre = data.nombre || currentUser.nombre;
    const apellido = data.apellido || currentUser.apellido;
    const telefono = data.telefono !== undefined ? data.telefono : currentUser.telefono;

    // Ejecutar procedimiento almacenado
    const result:any = await prisma.$queryRawUnsafe(
      `EXEC pr_actualizar_perfil_usuario @idUsuario = ${userId}, @nombre = '${nombre}', @apellido = '${apellido}', @telefono = ${telefono ? `'${telefono}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al actualizar perfil');
    }

    const updated = result[0];

    logger.info(`Usuario ${updated.email} actualizó su perfil`);

    return {
      id: updated.id_usuario!,
      email: updated.email!,
      nombre: updated.nombre!,
      apellido: updated.apellido!,
      telefono: updated.telefono,
      rol: updated.nombre_rol!
    };
  }
}

export const authService = new AuthService();
