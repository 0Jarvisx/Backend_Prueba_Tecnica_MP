import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { errorResponse } from '../utils/formatters';
import logger from '../utils/logger';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];

    const payload = verifyToken(token);

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id, deletedAt: null },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json(errorResponse('Usuario no válido o desactivado'));
    }

    req.user = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol.nombreRol,
      idRol: usuario.idRol,
      permisos: usuario.rol.permisos.map(rp => rp.permiso.nombrePermiso)
    };

    next();
  } catch (error) {
    logger.error('Error en autenticación:', error);
    return res.status(401).json(errorResponse('Token inválido o expirado'));
  }
}

