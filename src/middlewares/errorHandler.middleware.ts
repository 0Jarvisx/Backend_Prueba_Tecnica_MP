import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/formatters';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error no manejado:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json(errorResponse('Error en la base de datos'));
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse(err.message));
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token inválido o expirado'));
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  return res.status(statusCode).json(
    errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message
    )
  );
}
