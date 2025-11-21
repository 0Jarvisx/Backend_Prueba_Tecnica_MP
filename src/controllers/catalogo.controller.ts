import type { Request, Response } from 'express';
import { CatalogoService } from '../services/catalogo.service';
import { errorResponse, successResponse } from '../utils/formatters';

const catalogoService = new CatalogoService();

export class CatalogoController {
  async getEstadosExpediente(_req: Request, res: Response): Promise<void> {
    try {
      const estados = await catalogoService.listarEstadosExpediente();
      res.status(200).json(successResponse(estados, 'Estados obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener estados'));
      }
    }
  }

  async getEstadosIndicio(_req: Request, res: Response): Promise<void> {
    try {
      const estados = await catalogoService.listarEstadosIndicio();
      res.status(200).json(successResponse(estados, 'Estados de indicio obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener estados de indicio'));
      }
    }
  }

  async getUnidades(_req: Request, res: Response): Promise<void> {
    try {
      const unidades = await catalogoService.listarUnidades();
      res.status(200).json(successResponse(unidades, 'Unidades obtenidas correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener unidades'));
      }
    }
  }

  async getFiscalias(_req: Request, res: Response): Promise<void> {
    try {
      const fiscalias = await catalogoService.listarFiscalias();
      res.status(200).json(successResponse(fiscalias, 'Fiscalías obtenidas correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener fiscalías'));
      }
    }
  }

  async getTecnicos(_req: Request, res: Response): Promise<void> {
    try {
      const tecnicos = await catalogoService.listarTecnicos();
      res.status(200).json(successResponse(tecnicos, 'Técnicos obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener técnicos'));
      }
    }
  }

  async getDepartamentos(_req: Request, res: Response): Promise<void> {
    try {
      const departamentos = await catalogoService.listarDepartamentos();
      res.status(200).json(successResponse(departamentos, 'Departamentos obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener departamentos'));
      }
    }
  }

  async getMunicipiosByDepartamento(req: Request, res: Response): Promise<void> {
    try {
      const idDepartamento = parseInt(req.params.idDepartamento);

      if (isNaN(idDepartamento)) {
        res.status(400).json(errorResponse('ID de departamento inválido'));
        return;
      }

      const municipios = await catalogoService.listarMunicipiosPorDepartamento(idDepartamento);
      res.status(200).json(successResponse(municipios, 'Municipios obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener municipios'));
      }
    }
  }
}
