import { Usuario } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nombre: string;
        apellido: string;
        rol: string;
        idRol: number;
        permisos?: string[];
      };
      // Contexto de auditoría
      auditContext?: {
        ipAddress: string;
        userAgent: string;
        timestamp: Date;
      };
    }
  }
}

export {};
