import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/formatters';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('No autenticado'));
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json(errorResponse('No tienes permiso para realizar esta acción'));
    }

    next();
  };
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('No autenticado'));
    }

    const userPermissions = req.user.permisos || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json(errorResponse('No tienes permiso para realizar esta acción'));
    }

    next();
  };
}
