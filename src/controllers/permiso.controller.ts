import type { Request, Response } from 'express';
import { PermisoService } from '../services/permiso.service';
import { errorResponse, successResponse } from '../utils/formatters';

const permisoService = new PermisoService();

export class PermisoController {

  async registerPermission(req: Request, res: Response): Promise<void> {
    try {
      const { nombrePermiso, descripcion, modulo } = req.body;

      if (!nombrePermiso) {
        res.status(400).json(errorResponse('El nombre del permiso es requerido'));
        return;
      }

      const result = await permisoService.registrarPermiso({
        nombrePermiso,
        descripcion: descripcion || null,
        modulo: modulo || null,
      });

      res.status(201).json(successResponse(result, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al registrar permiso'));
      }
    }
  }

  async listPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { pagina, limite, busqueda, modulo } = req.query;

      const result = await permisoService.listarPermisos({
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
        busqueda: busqueda as string,
        modulo: modulo as string,
      });

      res.status(200).json(successResponse(result, 'Permisos obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener permisos'));
      }
    }
  }


  async listAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permisos = await permisoService.listarTodosPermisos();

      res.status(200).json(successResponse({ permisos }, 'Permisos obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener permisos'));
      }
    }
  }

  async getPermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de permiso es requerido'));
        return;
      }

      const permiso = await permisoService.obtenerPermiso(parseInt(id));

      res.status(200).json(successResponse(permiso, 'Permiso obtenido correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener permiso'));
      }
    }
  }

  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombrePermiso, descripcion, modulo } = req.body;

      if (!id) {
        res.status(400).json(errorResponse('ID de permiso es requerido'));
        return;
      }

      if (!nombrePermiso) {
        res.status(400).json(errorResponse('El nombre del permiso es requerido'));
        return;
      }

      const result = await permisoService.actualizarPermiso(parseInt(id), {
        nombrePermiso,
        descripcion: descripcion || null,
        modulo: modulo || null,
      });

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al actualizar permiso'));
      }
    }
  }

  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de permiso es requerido'));
        return;
      }

      const result = await permisoService.eliminarPermiso(parseInt(id));

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al eliminar permiso'));
      }
    }
  }
}
