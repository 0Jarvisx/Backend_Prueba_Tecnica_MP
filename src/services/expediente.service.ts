import { prisma } from '../config/database';
import type {
  CrearExpedienteResult,
  ListarExpedientesResult,
  ObtenerExpedienteResult,
  ActualizarExpedienteResult,
  EliminarExpedienteResult,
  AprobarExpedienteResult,
  RechazarExpedienteResult,
} from '../types/stored-procedures';
import { emailService } from './email.service';
import { bitacoraService, TipoEntidad } from './bitacora.service';
import logger from '../utils/logger';

export class ExpedienteService {
  /**
   * Crear un nuevo expediente
   */
  async crearExpediente(data: {
    numeroExpediente: string;
    numeroCasoMp?: string;
    idUsuarioRegistro: number;
    idTecnicoAsignado: number;
    idSupervisor?: number;
    idFiscalia: number;
    idUnidad: number;
    idEstado: number;
    tipoAnalisis?: string;
    fiscalSolicitante?: string;
    oficioSolicitud?: string;
    urgencia?: string;
    fechaLimite?: Date;
    tipoDelito?: string;
    lugarHecho?: string;
    fechaHecho?: Date;
    descripcionCaso?: string;
    observaciones?: string;
    ipAddress?: string;
  }): Promise<{ id_expediente: number; mensaje: string }> {
    const result: CrearExpedienteResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_crear_expediente
        @numeroExpediente = N'${data.numeroExpediente}',
        @numeroCasoMp = ${data.numeroCasoMp ? `N'${data.numeroCasoMp}'` : 'NULL'},
        @idUsuarioRegistro = ${data.idUsuarioRegistro},
        @idTecnicoAsignado = ${data.idTecnicoAsignado},
        @idSupervisor = ${data.idSupervisor || 'NULL'},
        @idFiscalia = ${data.idFiscalia},
        @idUnidad = ${data.idUnidad},
        @idEstado = ${data.idEstado},
        @tipoAnalisis = ${data.tipoAnalisis ? `N'${data.tipoAnalisis}'` : 'NULL'},
        @fiscalSolicitante = ${data.fiscalSolicitante ? `N'${data.fiscalSolicitante}'` : 'NULL'},
        @oficioSolicitud = ${data.oficioSolicitud ? `N'${data.oficioSolicitud}'` : 'NULL'},
        @urgencia = ${data.urgencia ? `N'${data.urgencia}'` : 'NULL'},
        @fechaLimite = ${data.fechaLimite ? `'${data.fechaLimite.toISOString().split('T')[0]}'` : 'NULL'},
        @tipoDelito = ${data.tipoDelito ? `N'${data.tipoDelito}'` : 'NULL'},
        @lugarHecho = ${data.lugarHecho ? `N'${data.lugarHecho}'` : 'NULL'},
        @fechaHecho = ${data.fechaHecho ? `'${data.fechaHecho.toISOString().split('T')[0]}'` : 'NULL'},
        @descripcionCaso = ${data.descripcionCaso ? `N'${data.descripcionCaso.replace(/'/g, "''")}'` : 'NULL'},
        @observaciones = ${data.observaciones ? `N'${data.observaciones.replace(/'/g, "''")}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al crear expediente');
    }

    // Registrar en bitácora
    await bitacoraService.registrarCreacion({
      tipoEntidad: TipoEntidad.EXPEDIENTE,
      idEntidad: result[0].id_expediente!,
      idExpediente: result[0].id_expediente!,
      idUsuario: data.idUsuarioRegistro,
      descripcion: `Expediente creado: ${data.numeroExpediente}`,
      ipAddress: data.ipAddress,
      detalles: {
        numeroExpediente: data.numeroExpediente,
        numeroCasoMp: data.numeroCasoMp,
        urgencia: data.urgencia,
        tipoDelito: data.tipoDelito,
        fiscalSolicitante: data.fiscalSolicitante
      }
    });

    return {
      id_expediente: result[0].id_expediente!,
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Listar expedientes con paginación y filtro por rol
   */
  async listarExpedientes(params: {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    idUsuario?: number;
    rolUsuario?: string;
    idEstado?: number;
    idUnidad?: number;
    idFiscalia?: number;
    soloActivos?: boolean;
  }): Promise<{
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
    expedientes: any[];
  }> {
    const pagina = params.pagina || 1;
    const limite = params.limite || 10;
    const busqueda = params.busqueda || null;
    const soloActivos = params.soloActivos !== undefined ? (params.soloActivos ? 1 : 0) : 1;

    const result: ListarExpedientesResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_listar_expedientes
        @pagina = ${pagina},
        @limite = ${limite},
        @busqueda = ${busqueda ? `N'${busqueda}'` : 'NULL'},
        @idUsuario = ${params.idUsuario || 'NULL'},
        @rolUsuario = ${params.rolUsuario ? `N'${params.rolUsuario}'` : 'NULL'},
        @idEstado = ${params.idEstado || 'NULL'},
        @idUnidad = ${params.idUnidad || 'NULL'},
        @idFiscalia = ${params.idFiscalia || 'NULL'},
        @soloActivos = ${soloActivos}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener expedientes');
    }

    const expedientes = result[0].expedientes ? JSON.parse(result[0].expedientes) : [];

    return {
      total: result[0].total,
      pagina: result[0].pagina,
      limite: result[0].limite,
      total_paginas: result[0].total_paginas,
      expedientes,
    };
  }

  /**
   * Obtener un expediente por ID con validación de permisos
   */
  async obtenerExpediente(
    idExpediente: number,
    idUsuario?: number,
    rolUsuario?: string
  ): Promise<ObtenerExpedienteResult> {
    const result: ObtenerExpedienteResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_obtener_expediente
        @idExpediente = ${idExpediente},
        @idUsuario = ${idUsuario || 'NULL'},
        @rolUsuario = ${rolUsuario ? `N'${rolUsuario}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Expediente no encontrado');
    }

    return result[0];
  }

  /**
   * Actualizar un expediente
   */
  async actualizarExpediente(
    idExpediente: number,
    data: {
      numeroExpediente: string;
      numeroCasoMp?: string;
      idTecnicoAsignado: number;
      idSupervisor?: number;
      idFiscalia: number;
      idUnidad: number;
      idEstado: number;
      idDepartamento?: number;
      idMunicipio?: number;
      tipoAnalisis?: string;
      fiscalSolicitante?: string;
      oficioSolicitud?: string;
      urgencia?: string;
      fechaLimite?: Date;
      tipoDelito?: string;
      lugarHecho?: string;
      fechaHecho?: Date;
      descripcionCaso?: string;
      observaciones?: string;
      idUsuarioModificador: number;
      ipAddress?: string;
    }
  ): Promise<{ mensaje: string }> {
    const result: ActualizarExpedienteResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_actualizar_expediente
        @idExpediente = ${idExpediente},
        @numeroExpediente = N'${data.numeroExpediente}',
        @numeroCasoMp = ${data.numeroCasoMp ? `N'${data.numeroCasoMp}'` : 'NULL'},
        @idTecnicoAsignado = ${data.idTecnicoAsignado},
        @idSupervisor = ${data.idSupervisor || 'NULL'},
        @idFiscalia = ${data.idFiscalia},
        @idUnidad = ${data.idUnidad},
        @idEstado = ${data.idEstado},
        @idDepartamento = ${data.idDepartamento || 'NULL'},
        @idMunicipio = ${data.idMunicipio || 'NULL'},
        @tipoAnalisis = ${data.tipoAnalisis ? `N'${data.tipoAnalisis}'` : 'NULL'},
        @fiscalSolicitante = ${data.fiscalSolicitante ? `N'${data.fiscalSolicitante}'` : 'NULL'},
        @oficioSolicitud = ${data.oficioSolicitud ? `N'${data.oficioSolicitud}'` : 'NULL'},
        @urgencia = ${data.urgencia ? `N'${data.urgencia}'` : 'NULL'},
        @fechaLimite = ${data.fechaLimite ? `'${data.fechaLimite.toISOString().split('T')[0]}'` : 'NULL'},
        @tipoDelito = ${data.tipoDelito ? `N'${data.tipoDelito}'` : 'NULL'},
        @lugarHecho = ${data.lugarHecho ? `N'${data.lugarHecho}'` : 'NULL'},
        @fechaHecho = ${data.fechaHecho ? `'${data.fechaHecho.toISOString().split('T')[0]}'` : 'NULL'},
        @descripcionCaso = ${data.descripcionCaso ? `N'${data.descripcionCaso.replace(/'/g, "''")}'` : 'NULL'},
        @observaciones = ${data.observaciones ? `N'${data.observaciones.replace(/'/g, "''")}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al actualizar expediente');
    }

    // Registrar en bitácora
    await bitacoraService.registrarActualizacion({
      tipoEntidad: TipoEntidad.EXPEDIENTE,
      idEntidad: idExpediente,
      idExpediente,
      idUsuario: data.idUsuarioModificador,
      descripcion: `Expediente actualizado: ${data.numeroExpediente}`,
      ipAddress: data.ipAddress,
      detalles: {
        numeroExpediente: data.numeroExpediente,
        estado: data.idEstado
      }
    });

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Eliminar un expediente (soft delete)
   */
  async eliminarExpediente(idExpediente: number, idUsuarioEliminador: number, ipAddress?: string): Promise<{ mensaje: string }> {
    // Obtener datos del expediente antes de eliminar
    const expediente = await this.obtenerExpediente(idExpediente);
    const result: EliminarExpedienteResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_eliminar_expediente @idExpediente = ${idExpediente}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al eliminar expediente');
    }

    // Registrar en bitácora
    await bitacoraService.registrarEliminacion({
      tipoEntidad: TipoEntidad.EXPEDIENTE,
      idEntidad: idExpediente,
      idExpediente,
      idUsuario: idUsuarioEliminador,
      descripcion: `Expediente eliminado: ${expediente.numero_expediente}`,
      ipAddress,
      detalles: {
        numeroExpediente: expediente.numero_expediente,
        numeroCasoMp: expediente.numero_caso_mp
      }
    });

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Aprobar un expediente (solo supervisores)
   */
  async aprobarExpediente(
    idExpediente: number,
    idSupervisor: number,
    ipAddress?: string
  ): Promise<{ mensaje: string }> {
    const result: AprobarExpedienteResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_aprobar_expediente
        @idExpediente = ${idExpediente},
        @idSupervisor = ${idSupervisor}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al aprobar expediente');
    }

    // Obtener número de expediente para la bitácora
    const expediente = await prisma.expediente.findUnique({
      where: { id: idExpediente },
      select: { numeroExpediente: true }
    });

    // Registrar en bitácora
    await bitacoraService.registrarAprobacion({
      idExpediente,
      idUsuario: idSupervisor,
      numeroExpediente: expediente?.numeroExpediente || 'N/A',
      ipAddress
    });

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Rechazar un expediente (solo supervisores) y enviar email al técnico
   */
  async rechazarExpediente(
    idExpediente: number,
    idSupervisor: number,
    motivoRechazo: string,
    ipAddress?: string
  ): Promise<{ mensaje: string }> {
    const result: RechazarExpedienteResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_rechazar_expediente
        @idExpediente = ${idExpediente},
        @idSupervisor = ${idSupervisor},
        @motivoRechazo = N'${motivoRechazo.replace(/'/g, "''")}'`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al rechazar expediente');
    }

    // Enviar email al técnico sobre el rechazo
    if (result[0].tecnico_email && result[0].tecnico_nombre && result[0].numero_expediente) {
      try {
        await emailService.sendExpedienteRechazadoEmail(
          result[0].tecnico_email,
          result[0].tecnico_nombre,
          result[0].numero_expediente,
          motivoRechazo
        );
        logger.info(`Email de rechazo enviado a ${result[0].tecnico_email} para expediente ${result[0].numero_expediente}`);
      } catch (emailError) {
        logger.error('Error al enviar email de rechazo:', emailError);
        // No lanzamos error para no bloquear el flujo, solo logueamos
      }
    }

    // Registrar en bitácora
    await bitacoraService.registrarRechazo({
      idExpediente,
      idUsuario: idSupervisor,
      numeroExpediente: result[0].numero_expediente || 'N/A',
      motivoRechazo,
      ipAddress
    });

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Crear expediente con indicios en una sola transacción
   */
  async crearExpedienteConIndicios(data: {
    numeroCasoMp?: string;
    idUsuarioRegistro: number;
    idTecnicoAsignado?: number;
    idFiscalia?: number;
    idUnidad?: number;
    idEstado?: number;
    urgencia?: string;
    tipoDelito?: string;
    observaciones?: string;
    ipAddress?: string;
    indicios?: Array<{
      descripcion: string;
      tipoObjeto?: string;
      color?: string;
      tamanio?: string;
      peso?: number;
      pesoUnidad?: string;
      ubicacionHallazgo?: string;
      idEstadoIndicio?: number;
      observaciones?: string;
      cantidad?: number;
    }>;
  }): Promise<{ idExpediente: number; numeroExpediente: string; mensaje: string; indiciosCreados: Array<{ idIndicio: number; numeroIndicio: string }> }> {
    const indiciosJson = data.indicios && data.indicios.length > 0
      ? JSON.stringify(data.indicios)
      : null;

    const result: any[] = await prisma.$queryRawUnsafe(
      `EXEC pr_crear_expediente_con_indicios
        @numeroCasoMp = ${data.numeroCasoMp ? `N'${data.numeroCasoMp}'` : 'NULL'},
        @idUsuarioRegistro = ${data.idUsuarioRegistro},
        @idTecnicoAsignado = ${data.idTecnicoAsignado || 'NULL'},
        @idFiscalia = ${data.idFiscalia || 'NULL'},
        @idUnidad = ${data.idUnidad || 'NULL'},
        @idEstado = ${data.idEstado || 'NULL'},
        @urgencia = ${data.urgencia ? `N'${data.urgencia}'` : `N'ordinario'`},
        @tipoDelito = ${data.tipoDelito ? `N'${data.tipoDelito}'` : 'NULL'},
        @observaciones = ${data.observaciones ? `N'${data.observaciones.replace(/'/g, "''")}'` : 'NULL'},
        @indiciosJson = ${indiciosJson ? `N'${indiciosJson.replace(/'/g, "''")}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al crear expediente');
    }

    const indiciosCreados = result[0].indicios_creados ? JSON.parse(result[0].indicios_creados) : [];

    // Registrar en bitácora
    await bitacoraService.registrarCreacion({
      tipoEntidad: TipoEntidad.EXPEDIENTE,
      idEntidad: result[0].id_expediente,
      idExpediente: result[0].id_expediente,
      idUsuario: data.idUsuarioRegistro,
      descripcion: `Expediente creado con ${indiciosCreados.length} indicios: ${result[0].numero_expediente}`,
      ipAddress: data.ipAddress,
      detalles: {
        numeroExpediente: result[0].numero_expediente,
        numeroCasoMp: data.numeroCasoMp,
        cantidadIndicios: indiciosCreados.length,
        urgencia: data.urgencia,
        tipoDelito: data.tipoDelito
      }
    });

    return {
      idExpediente: result[0].id_expediente,
      numeroExpediente: result[0].numero_expediente,
      mensaje: result[0].mensaje,
      indiciosCreados,
    };
  }
}
