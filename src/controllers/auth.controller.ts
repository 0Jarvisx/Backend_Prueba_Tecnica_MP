import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/formatters';
import logger from '../utils/logger';

export class AuthController {
  
  async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Datos inválidos', errors.array().map(e => e.msg)));
      }

      const { email, password } = req.body;
      const ipAddress = req.auditContext?.ipAddress;
      const userAgent = req.auditContext?.userAgent;

      const result = await authService.login(email, password, ipAddress, userAgent);

      return res.status(200).json(successResponse(result, 'Login exitoso'));
    } catch (error) {
      logger.error('Error en login:', error);
      const message = error instanceof Error ? error.message : 'Error en login';
      return res.status(401).json(errorResponse(message));
    }
  }

  async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Datos inválidos', errors.array().map(e => e.msg)));
      }

      const { email, password, nombre, apellido, dpi, telefono, idRol } = req.body;
      const result = await authService.register({
        email,
        password,
        nombre,
        apellido,
        dpi,
        telefono,
        idRol
      });

      return res.status(201).json(successResponse(result, 'Usuario registrado exitosamente'));
    } catch (error) {
      logger.error('Error en registro:', error);
      const message = error instanceof Error ? error.message : 'Error en registro';
      return res.status(400).json(errorResponse(message));
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Datos inválidos', errors.array().map(e => e.msg)));
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(errorResponse('No autenticado'));
      }

      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.auditContext?.ipAddress;

      await authService.changePassword(userId, currentPassword, newPassword, ipAddress);

      return res.status(200).json(successResponse(null, 'Contraseña actualizada exitosamente'));
    } catch (error) {
      logger.error('Error al cambiar contraseña:', error);
      const message = error instanceof Error ? error.message : 'Error al cambiar contraseña';
      return res.status(400).json(errorResponse(message));
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Datos inválidos', errors.array().map(e => e.msg)));
      }

      const { email } = req.body;
      const token = await authService.requestPasswordReset(email);

      return res.status(200).json(successResponse(
        { resetToken: token },
        'Si el email existe, recibirás instrucciones para resetear tu contraseña'
      ));
    } catch (error) {
      logger.error('Error en solicitud de reset:', error);
      // Por seguridad, siempre retornamos el mismo mensaje
      return res.status(200).json(successResponse(
        null,
        'Si el email existe, recibirás instrucciones para resetear tu contraseña'
      ));
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Datos inválidos', errors.array().map(e => e.msg)));
      }

      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);

      return res.status(200).json(successResponse(null, 'Contraseña reseteada exitosamente'));
    } catch (error) {
      logger.error('Error en reset de contraseña:', error);
      const message = error instanceof Error ? error.message : 'Error al resetear contraseña';
      return res.status(400).json(errorResponse(message));
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(errorResponse('Token no proporcionado'));
      }

      const token = authHeader.split(' ')[1];
      const newToken = await authService.refreshToken(token);

      return res.status(200).json(successResponse({ token: newToken }, 'Token refrescado'));
    } catch (error) {
      logger.error('Error al refrescar token:', error);
      const message = error instanceof Error ? error.message : 'Error al refrescar token';
      return res.status(401).json(errorResponse(message));
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(errorResponse('No autenticado'));
      }

      const profile = await authService.getProfile(userId);

      return res.status(200).json(successResponse(profile));
    } catch (error) {
      logger.error('Error al obtener perfil:', error);
      const message = error instanceof Error ? error.message : 'Error al obtener perfil';
      return res.status(400).json(errorResponse(message));
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errorResponse('Datos inválidos', errors.array().map(e => e.msg)));
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(errorResponse('No autenticado'));
      }

      const { nombre, apellido, telefono } = req.body;
      const profile = await authService.updateProfile(userId, { nombre, apellido, telefono });

      return res.status(200).json(successResponse(profile, 'Perfil actualizado'));
    } catch (error) {
      logger.error('Error al actualizar perfil:', error);
      const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
      return res.status(400).json(errorResponse(message));
    }
  }
}

export const authController = new AuthController();
