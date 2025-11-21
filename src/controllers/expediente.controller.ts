import type { Request, Response } from 'express';
import { ExpedienteService } from '../services/expediente.service';
import { errorResponse, successResponse } from '../utils/formatters';

const expedienteService = new ExpedienteService();

export class ExpedienteController {
  async listExpedientes(req: Request, res: Response): Promise<void> {
    try {
      const { pagina, limite, busqueda, idEstado, idUnidad, idFiscalia, soloActivos } = req.query;

      // Obtener datos del usuario del token
      const userId = req.user?.id;
      const userRole = req.user?.rol;

      const result = await expedienteService.listarExpedientes({
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
        busqueda: busqueda as string,
        idUsuario: userId,
        rolUsuario: userRole,
        idEstado: idEstado ? parseInt(idEstado as string) : undefined,
        idUnidad: idUnidad ? parseInt(idUnidad as string) : undefined,
        idFiscalia: idFiscalia ? parseInt(idFiscalia as string) : undefined,
        soloActivos: soloActivos === 'false' ? false : true,
      });

      res.status(200).json(successResponse(result, 'Expedientes obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener expedientes'));
      }
    }
  }

  async getExpediente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.rol;

      if (!id) {
        res.status(400).json(errorResponse('ID de expediente es requerido'));
        return;
      }

      const expediente = await expedienteService.obtenerExpediente(
        parseInt(id),
        userId,
        userRole
      );

      res.status(200).json(successResponse(expediente, 'Expediente obtenido correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener expediente'));
      }
    }
  }

  async createExpediente(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Usuario no autenticado'));
        return;
      }

      const {
        numeroExpediente,
        numeroCasoMp,
        idTecnicoAsignado,
        idSupervisor,
        idFiscalia,
        idUnidad,
        idEstado,
        tipoAnalisis,
        fiscalSolicitante,
        oficioSolicitud,
        urgencia,
        fechaLimite,
        tipoDelito,
        lugarHecho,
        fechaHecho,
        descripcionCaso,
        observaciones,
      } = req.body;

      if (!numeroExpediente || !idFiscalia || !idUnidad || !idEstado) {
        res.status(400).json(errorResponse('Campos obligatorios faltantes'));
        return;
      }

      const ipAddress = req.auditContext?.ipAddress;

      const result = await expedienteService.crearExpediente({
        numeroExpediente,
        numeroCasoMp,
        idUsuarioRegistro: userId,
        idTecnicoAsignado: idTecnicoAsignado || userId,
        idSupervisor,
        idFiscalia,
        idUnidad,
        idEstado,
        tipoAnalisis,
        fiscalSolicitante,
        oficioSolicitud,
        urgencia,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : undefined,
        tipoDelito,
        lugarHecho,
        fechaHecho: fechaHecho ? new Date(fechaHecho) : undefined,
        descripcionCaso,
        observaciones,
        ipAddress,
      });

      res.status(201).json(successResponse(result, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al crear expediente'));
      }
    }
  }

  async createExpedienteConIndicios(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Usuario no autenticado'));
        return;
      }

      const {
        numeroCasoMp,
        idTecnicoAsignado,
        idFiscalia,
        idUnidad,
        idEstado,
        urgencia,
        tipoDelito,
        observaciones,
        indicios,
      } = req.body;

      const ipAddress = req.auditContext?.ipAddress;

      const result = await expedienteService.crearExpedienteConIndicios({
        numeroCasoMp,
        idUsuarioRegistro: userId,
        idTecnicoAsignado: idTecnicoAsignado || userId,
        idFiscalia,
        idUnidad,
        idEstado,
        urgencia,
        tipoDelito,
        observaciones,
        indicios,
        ipAddress,
      });

      res.status(201).json(successResponse(result, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al crear expediente'));
      }
    }
  }

  async updateExpediente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de expediente es requerido'));
        return;
      }

      const {
        numeroExpediente,
        numeroCasoMp,
        idTecnicoAsignado,
        idSupervisor,
        idFiscalia,
        idUnidad,
        idEstado,
        idDepartamento,
        idMunicipio,
        tipoAnalisis,
        fiscalSolicitante,
        oficioSolicitud,
        urgencia,
        fechaLimite,
        tipoDelito,
        lugarHecho,
        fechaHecho,
        descripcionCaso,
        observaciones,
      } = req.body;

      if (!numeroExpediente || !idTecnicoAsignado || !idFiscalia || !idUnidad || !idEstado) {
        res.status(400).json(errorResponse('Campos obligatorios faltantes'));
        return;
      }

      const ipAddress = req.auditContext?.ipAddress;
      const idUsuarioModificador = req.user?.id || 0;

      const result = await expedienteService.actualizarExpediente(parseInt(id), {
        numeroExpediente,
        numeroCasoMp,
        idTecnicoAsignado,
        idSupervisor,
        idFiscalia,
        idUnidad,
        idEstado,
        idDepartamento,
        idMunicipio,
        tipoAnalisis,
        fiscalSolicitante,
        oficioSolicitud,
        urgencia,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : undefined,
        tipoDelito,
        lugarHecho,
        fechaHecho: fechaHecho ? new Date(fechaHecho) : undefined,
        descripcionCaso,
        observaciones,
        idUsuarioModificador,
        ipAddress,
      });

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al actualizar expediente'));
      }
    }
  }

  async deleteExpediente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de expediente es requerido'));
        return;
      }

      const ipAddress = req.auditContext?.ipAddress;
      const idUsuarioEliminador = req.user?.id || 0;

      const result = await expedienteService.eliminarExpediente(parseInt(id), idUsuarioEliminador, ipAddress);

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al eliminar expediente'));
      }
    }
  }

  async aprobarExpediente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.rol;

      if (!id) {
        res.status(400).json(errorResponse('ID de expediente es requerido'));
        return;
      }

      // Verificar que sea supervisor o admin
      if (userRole !== 'SUPERVISOR' && userRole !== 'ADMIN') {
        res.status(403).json(errorResponse('Solo supervisores pueden aprobar expedientes'));
        return;
      }

      if (!userId) {
        res.status(401).json(errorResponse('Usuario no autenticado'));
        return;
      }

      const ipAddress = req.auditContext?.ipAddress;

      const result = await expedienteService.aprobarExpediente(parseInt(id), userId, ipAddress);

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al aprobar expediente'));
      }
    }
  }

  async rechazarExpediente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivoRechazo } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.rol;

      if (!id) {
        res.status(400).json(errorResponse('ID de expediente es requerido'));
        return;
      }

      if (!motivoRechazo || motivoRechazo.trim() === '') {
        res.status(400).json(errorResponse('El motivo de rechazo es obligatorio'));
        return;
      }

      // Verificar que sea supervisor o admin
      if (userRole !== 'SUPERVISOR' && userRole !== 'ADMIN') {
        res.status(403).json(errorResponse('Solo supervisores pueden rechazar expedientes'));
        return;
      }

      if (!userId) {
        res.status(401).json(errorResponse('Usuario no autenticado'));
        return;
      }

      const result = await expedienteService.rechazarExpediente(
        parseInt(id),
        userId,
        motivoRechazo.trim()
      );

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al rechazar expediente'));
      }
    }
  }
}
