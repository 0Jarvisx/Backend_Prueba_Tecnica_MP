import type { Request, Response } from 'express';
import { IndicioService } from '../services/indicio.service';
import { errorResponse, successResponse } from '../utils/formatters';

const indicioService = new IndicioService();

export class IndicioController {
  async createIndicio(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(errorResponse('Usuario no autenticado'));
        return;
      }

      const {
        idExpediente,
        numeroIndicio,
        descripcion,
        tipoObjeto,
        color,
        tamanio,
        peso,
        pesoUnidad,
        ubicacionHallazgo,
        idEstadoIndicio,
        observaciones,
        cantidad,
      } = req.body;

      if (!idExpediente || !numeroIndicio || !descripcion || !idEstadoIndicio) {
        res.status(400).json(errorResponse('Campos obligatorios faltantes'));
        return;
      }

      const result = await indicioService.crearIndicio({
        idExpediente: parseInt(idExpediente),
        numeroIndicio,
        descripcion,
        tipoObjeto,
        color,
        tamanio,
        peso: peso ? parseFloat(peso) : undefined,
        pesoUnidad,
        ubicacionHallazgo,
        idTecnicoRegistro: userId,
        idEstadoIndicio: parseInt(idEstadoIndicio),
        observaciones,
        cantidad: cantidad ? parseInt(cantidad) : undefined,
      });

      res.status(201).json(successResponse(result, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al crear indicio'));
      }
    }
  }

  async listIndicios(req: Request, res: Response): Promise<void> {
    try {
      const { pagina, limite, busqueda, idExpediente, soloActivos } = req.query;

      const result = await indicioService.listarIndicios({
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
        busqueda: busqueda as string,
        idExpediente: idExpediente ? parseInt(idExpediente as string) : undefined,
        soloActivos: soloActivos === 'false' ? false : true,
      });

      res.status(200).json(successResponse(result, 'Indicios obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener indicios'));
      }
    }
  }

  async getIndicio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de indicio es requerido'));
        return;
      }

      const indicio = await indicioService.obtenerIndicio(parseInt(id));

      res.status(200).json(successResponse(indicio, 'Indicio obtenido correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener indicio'));
      }
    }
  }

  async updateIndicio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        res.status(400).json(errorResponse('ID de indicio es requerido'));
        return;
      }

      const {
        numeroIndicio,
        descripcion,
        tipoObjeto,
        color,
        tamanio,
        peso,
        pesoUnidad,
        ubicacionHallazgo,
        idEstadoIndicio,
        observaciones,
        cantidad,
      } = req.body;

      if (!numeroIndicio || !descripcion || !idEstadoIndicio) {
        res.status(400).json(errorResponse('Campos obligatorios faltantes'));
        return;
      }

      const result = await indicioService.actualizarIndicio(parseInt(id), {
         idUsuarioModificador: userId,
        numeroIndicio,
        descripcion,
        tipoObjeto,
        color,
        tamanio,
        peso: peso ? parseFloat(peso) : undefined,
        pesoUnidad,
        ubicacionHallazgo,
        idEstadoIndicio: parseInt(idEstadoIndicio),
        observaciones,
        cantidad: cantidad ? parseInt(cantidad) : undefined,
      });

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al actualizar indicio'));
      }
    }
  }

  async deleteIndicio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const ipAddress = req.auditContext?.ipAddress;
      if (!id) {
        res.status(400).json(errorResponse('ID de indicio es requerido'));
        return;
      }

      const result = await indicioService.eliminarIndicio(parseInt(id), userId, ipAddress);

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al eliminar indicio'));
      }
    }
  }
}
