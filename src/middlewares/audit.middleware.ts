import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para capturar contexto de auditoría
 * Extrae información relevante del request para el registro en bitácora
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Obtener IP del cliente
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown';

  // Obtener User Agent
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Almacenar contexto de auditoría en el request
  req.auditContext = {
    ipAddress,
    userAgent,
    timestamp: new Date()
  };

  next();
};

/**
 * Middleware para logging de requests (opcional)
 * Útil para debugging y auditoría general
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.auditContext?.ipAddress || req.ip,
      userId: req.user?.id,
      userEmail: req.user?.email
    };

    // Log basado en el código de estado
    if (res.statusCode >= 500) {
      console.error('[ERROR]', logData);
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', logData);
    } else {
      console.log('[INFO]', logData);
    }
  });

  next();
};
