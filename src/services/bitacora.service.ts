import { prisma } from '../config/database';
import logger from '../utils/logger';

/**
 * Tipos de entidades que se pueden auditar
 */
export enum TipoEntidad {
  EXPEDIENTE = 'EXPEDIENTE',
  INDICIO = 'INDICIO',
  USUARIO = 'USUARIO',
  DOCUMENTO = 'DOCUMENTO',
  ROL = 'ROL',
  PERMISO = 'PERMISO',
  ASIGNACION = 'ASIGNACION',
  AUTENTICACION = 'AUTENTICACION'
}

/**
 * Tipos de acciones en el sistema
 */
export enum AccionBitacora {
  // Acciones CRUD básicas
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Acciones específicas de expedientes
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ASSIGN = 'ASSIGN',

  // Acciones de autenticación
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',

  // Acciones de documentos
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',

  // Acciones de estado
  CHANGE_STATUS = 'CHANGE_STATUS',

  // Acciones de permisos
  GRANT_PERMISSION = 'GRANT_PERMISSION',
  REVOKE_PERMISSION = 'REVOKE_PERMISSION'
}

/**
 * Interfaz para el registro de bitácora
 */
export interface RegistroBitacoraData {
  // Identificadores de entidades
  idExpediente?: number;
  idIndicio?: number;
  idUsuario: number;

  // Información de la acción
  accion: AccionBitacora;
  tipoEntidad: TipoEntidad;
  idEntidad?: number; // ID genérico de la entidad afectada

  // Descripción y contexto
  descripcion: string;
  ipAddress?: string;
  userAgent?: string;

  // Detalles adicionales (flexible para cualquier propiedad)
  detalles?: {
    camposActualizados?: string[];
    valoresAnteriores?: Record<string, any>;
    valoresNuevos?: Record<string, any>;
    motivoRechazo?: string;
    emailNotificado?: string;
    rol?: string;
    permisos?: string[];
    nombreArchivo?: string;
    rutaArchivo?: string;
    metadata?: Record<string, any>;
    email?: string;
    esPrimerCambio?: boolean;
    tipoDocumento?: string;
    numeroIndicio?: string;
    descripcion?: string;
    tipoObjeto?: string;
    cantidad?: number;
    modulo?: string;
    userAgent?: string;
    [key: string]: any; // Permite propiedades adicionales
  };
}

/**
 * Interfaz para filtros de consulta de bitácora
 */
export interface FiltrosBitacora {
  idExpediente?: number;
  idIndicio?: number;
  idUsuario?: number;
  accion?: AccionBitacora | string;
  tipoEntidad?: TipoEntidad;
  fechaDesde?: Date;
  fechaHasta?: Date;
  pagina?: number;
  limite?: number;
}

/**
 * Servicio centralizado para gestión de bitácora y auditoría
 */
export class BitacoraService {
  /**
   * Registra una acción en la bitácora
   */
  async registrarAccion(data: RegistroBitacoraData): Promise<void> {
    try {
      // Preparar detalles JSON
      const detallesJson = data.detalles ? JSON.stringify(data.detalles) : null;

      // Si no hay idExpediente pero hay idIndicio, obtener el idExpediente del indicio
      let idExpediente = data.idExpediente;

      if (!idExpediente && data.idIndicio) {
        const indicio = await prisma.indicio.findUnique({
          where: { id: data.idIndicio },
          select: { idExpediente: true }
        });

        if (indicio) {
          idExpediente = indicio.idExpediente;
        }
      }

      // Para entidades que no tienen expediente asociado, usar un valor por defecto
      // o modificar el esquema para hacer idExpediente nullable
      const finalIdExpediente = idExpediente || 0; // 0 indica que no aplica

      // Crear registro en bitácora
      await prisma.bitacora.create({
        data: {
          idExpediente: finalIdExpediente,
          idUsuario: data.idUsuario,
          accion: data.accion,
          descripcion: data.descripcion,
          ipAddress: data.ipAddress || null,
          detallesJson: detallesJson
        }
      });

      // Log adicional en Winston para trazabilidad
      logger.info('Bitácora registrada', {
        accion: data.accion,
        tipoEntidad: data.tipoEntidad,
        idUsuario: data.idUsuario,
        idExpediente: finalIdExpediente,
        descripcion: data.descripcion
      });

    } catch (error) {
      // No lanzar error para no interrumpir la operación principal
      // Solo registrar el error
      logger.error('Error al registrar en bitácora:', error);
    }
  }

  /**
   * Registra la creación de una entidad
   */
  async registrarCreacion(params: {
    tipoEntidad: TipoEntidad;
    idEntidad: number;
    idUsuario: number;
    idExpediente?: number;
    idIndicio?: number;
    descripcion: string;
    ipAddress?: string;
    detalles?: any;
  }): Promise<void> {
    await this.registrarAccion({
      ...params,
      accion: AccionBitacora.CREATE
    });
  }

  /**
   * Registra la actualización de una entidad
   */
  async registrarActualizacion(params: {
    tipoEntidad: TipoEntidad;
    idEntidad: number;
    idUsuario: number;
    idExpediente?: number;
    idIndicio?: number;
    descripcion: string;
    ipAddress?: string;
    camposActualizados?: string[];
    valoresAnteriores?: Record<string, any>;
    valoresNuevos?: Record<string, any>;
    detalles?: any;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: params.tipoEntidad,
      idEntidad: params.idEntidad,
      idUsuario: params.idUsuario,
      idExpediente: params.idExpediente,
      idIndicio: params.idIndicio,
      accion: AccionBitacora.UPDATE,
      descripcion: params.descripcion,
      ipAddress: params.ipAddress,
      detalles: {
        camposActualizados: params.camposActualizados,
        valoresAnteriores: params.valoresAnteriores,
        valoresNuevos: params.valoresNuevos,
        ...params.detalles
      }
    });
  }

  /**
   * Registra la eliminación de una entidad
   */
  async registrarEliminacion(params: {
    tipoEntidad: TipoEntidad;
    idEntidad: number;
    idUsuario: number;
    idExpediente?: number;
    idIndicio?: number;
    descripcion: string;
    ipAddress?: string;
    detalles?: any;
  }): Promise<void> {
    await this.registrarAccion({
      ...params,
      accion: AccionBitacora.DELETE
    });
  }

  /**
   * Registra la aprobación de un expediente
   */
  async registrarAprobacion(params: {
    idExpediente: number;
    idUsuario: number;
    numeroExpediente: string;
    ipAddress?: string;
    detalles?: any;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: TipoEntidad.EXPEDIENTE,
      idExpediente: params.idExpediente,
      idUsuario: params.idUsuario,
      accion: AccionBitacora.APPROVE,
      descripcion: `Expediente aprobado: ${params.numeroExpediente}`,
      ipAddress: params.ipAddress,
      detalles: params.detalles
    });
  }

  /**
   * Registra el rechazo de un expediente
   */
  async registrarRechazo(params: {
    idExpediente: number;
    idUsuario: number;
    numeroExpediente: string;
    motivoRechazo: string;
    ipAddress?: string;
    detalles?: any;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: TipoEntidad.EXPEDIENTE,
      idExpediente: params.idExpediente,
      idUsuario: params.idUsuario,
      accion: AccionBitacora.REJECT,
      descripcion: `Expediente rechazado: ${params.numeroExpediente}`,
      ipAddress: params.ipAddress,
      detalles: {
        motivoRechazo: params.motivoRechazo,
        ...params.detalles
      }
    });
  }

  /**
   * Registra un inicio de sesión
   */
  async registrarLogin(params: {
    idUsuario: number;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: TipoEntidad.AUTENTICACION,
      idUsuario: params.idUsuario,
      accion: AccionBitacora.LOGIN,
      descripcion: `Usuario autenticado: ${params.email}`,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      detalles: {
        email: params.email,
        userAgent: params.userAgent
      }
    });
  }

  /**
   * Registra un cambio de contraseña
   */
  async registrarCambioPassword(params: {
    idUsuario: number;
    email: string;
    ipAddress?: string;
    esPrimerCambio?: boolean;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: TipoEntidad.USUARIO,
      idUsuario: params.idUsuario,
      accion: AccionBitacora.CHANGE_PASSWORD,
      descripcion: `Contraseña cambiada: ${params.email}`,
      ipAddress: params.ipAddress,
      detalles: {
        esPrimerCambio: params.esPrimerCambio || false
      }
    });
  }

  /**
   * Registra la carga de un documento
   */
  async registrarCargaDocumento(params: {
    idExpediente: number;
    idIndicio?: number;
    idUsuario: number;
    nombreArchivo: string;
    tipoDocumento: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: TipoEntidad.DOCUMENTO,
      idExpediente: params.idExpediente,
      idIndicio: params.idIndicio,
      idUsuario: params.idUsuario,
      accion: AccionBitacora.UPLOAD,
      descripcion: `Documento cargado: ${params.nombreArchivo}`,
      ipAddress: params.ipAddress,
      detalles: {
        nombreArchivo: params.nombreArchivo,
        tipoDocumento: params.tipoDocumento
      }
    });
  }

  /**
   * Registra la descarga de un documento
   */
  async registrarDescargaDocumento(params: {
    idExpediente: number;
    idIndicio?: number;
    idUsuario: number;
    nombreArchivo: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.registrarAccion({
      tipoEntidad: TipoEntidad.DOCUMENTO,
      idExpediente: params.idExpediente,
      idIndicio: params.idIndicio,
      idUsuario: params.idUsuario,
      accion: AccionBitacora.DOWNLOAD,
      descripcion: `Documento descargado: ${params.nombreArchivo}`,
      ipAddress: params.ipAddress,
      detalles: {
        nombreArchivo: params.nombreArchivo
      }
    });
  }

  /**
   * Consulta registros de bitácora con filtros
   */
  async consultarBitacora(filtros: FiltrosBitacora): Promise<{
    total: number;
    registros: any[];
    pagina: number;
    limite: number;
  }> {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 50;
    const skip = (pagina - 1) * limite;

    // Construir condiciones de filtrado
    const where: any = {};

    if (filtros.idExpediente) {
      where.idExpediente = filtros.idExpediente;
    }

    if (filtros.idUsuario) {
      where.idUsuario = filtros.idUsuario;
    }

    if (filtros.accion) {
      where.accion = filtros.accion;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fechaHora = {};

      if (filtros.fechaDesde) {
        where.fechaHora.gte = filtros.fechaDesde;
      }

      if (filtros.fechaHasta) {
        where.fechaHora.lte = filtros.fechaHasta;
      }
    }

    // Ejecutar consultas
    const [total, registros] = await Promise.all([
      prisma.bitacora.count({ where }),
      prisma.bitacora.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              rol: {
                select: {
                  nombreRol: true
                }
              }
            }
          },
          expediente: {
            select: {
              id: true,
              numeroExpediente: true,
              numeroCasoMp: true
            }
          }
        },
        orderBy: {
          fechaHora: 'desc'
        },
        skip,
        take: limite
      })
    ]);

    return {
      total,
      registros,
      pagina,
      limite
    };
  }

  /**
   * Obtiene el historial de cambios de un expediente
   */
  async obtenerHistorialExpediente(idExpediente: number): Promise<any[]> {
    return await prisma.bitacora.findMany({
      where: {
        idExpediente
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            rol: {
              select: {
                nombreRol: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaHora: 'desc'
      }
    });
  }

  /**
   * Obtiene estadísticas de actividad por usuario
   */
  async obtenerEstadisticasUsuario(
    idUsuario: number,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<any> {
    const where: any = { idUsuario };

    if (fechaDesde || fechaHasta) {
      where.fechaHora = {};

      if (fechaDesde) {
        where.fechaHora.gte = fechaDesde;
      }

      if (fechaHasta) {
        where.fechaHora.lte = fechaHasta;
      }
    }

    const estadisticas = await prisma.bitacora.groupBy({
      by: ['accion'],
      where,
      _count: {
        accion: true
      }
    });

    return estadisticas;
  }
}

// Exportar instancia única del servicio
export const bitacoraService = new BitacoraService();
