import type { Request, Response } from 'express';
import { AsignacionService } from '../services/asignacion.service';
import { errorResponse, successResponse } from '../utils/formatters';

const asignacionService = new AsignacionService();

export class AsignacionController {
  async listarSupervisores(_req: Request, res: Response): Promise<void> {
    try {
      const supervisores = await asignacionService.listarSupervisores();
      res.status(200).json(successResponse(supervisores, 'Supervisores obtenidos'));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async listarTecnicosSinSupervisor(_req: Request, res: Response): Promise<void> {
    try {
      const tecnicos = await asignacionService.listarTecnicosSinSupervisor();
      res.status(200).json(successResponse(tecnicos, 'Técnicos obtenidos'));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async listarAsignaciones(_req: Request, res: Response): Promise<void> {
    try {
      const asignaciones = await asignacionService.listarAsignaciones();
      res.status(200).json(successResponse(asignaciones, 'Asignaciones obtenidas'));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async asignarSupervisor(req: Request, res: Response): Promise<void> {
    try {
      const { idSupervisor, idTecnico } = req.body;
      if (!idSupervisor || !idTecnico) {
        res.status(400).json(errorResponse('Supervisor y técnico son requeridos'));
        return;
      }
      const result = await asignacionService.asignarSupervisor(idSupervisor, idTecnico);
      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async eliminarAsignacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json(errorResponse('ID de asignación requerido'));
        return;
      }
      const result = await asignacionService.eliminarAsignacion(parseInt(id));
      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }
}
