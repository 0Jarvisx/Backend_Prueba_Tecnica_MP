import type { Request, Response } from 'express';
import { RolService } from '../services/rol.service';
import { errorResponse, successResponse } from '../utils/formatters';

const rolService = new RolService();

export class RolController {

  async registerRole(req: Request, res: Response): Promise<void> {
    try {
      const { nombreRol, descripcion } = req.body;

      if (!nombreRol) {
        res.status(400).json(errorResponse('El nombre del rol es requerido'));
        return;
      }

      const result = await rolService.registrarRol({
        nombreRol,
        descripcion: descripcion || null,
      });

      res.status(201).json(successResponse(result, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al registrar rol'));
      }
    }
  }

  async listRoles(req: Request, res: Response): Promise<void> {
    try {
      const { pagina, limite, busqueda, soloActivos } = req.query;

      const result = await rolService.listarRoles({
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
        busqueda: busqueda as string,
        soloActivos: soloActivos === 'false' ? false : true,
      });

      res.status(200).json(successResponse(result, 'Roles obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener roles'));
      }
    }
  }

  async getRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de rol es requerido'));
        return;
      }

      const rol = await rolService.obtenerRol(parseInt(id));

      res.status(200).json(successResponse(rol, 'Rol obtenido correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener rol'));
      }
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombreRol, descripcion, activo } = req.body;

      if (!id) {
        res.status(400).json(errorResponse('ID de rol es requerido'));
        return;
      }

      if (!nombreRol || activo === undefined) {
        res.status(400).json(errorResponse('Todos los campos obligatorios deben ser proporcionados'));
        return;
      }

      const result = await rolService.actualizarRol(parseInt(id), {
        nombreRol,
        descripcion: descripcion || null,
        activo: Boolean(activo),
      });

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al actualizar rol'));
      }
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de rol es requerido'));
        return;
      }

      const result = await rolService.eliminarRol(parseInt(id));

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al eliminar rol'));
      }
    }
  }

  async assignPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permisos } = req.body;

      if (!id) {
        res.status(400).json(errorResponse('ID de rol es requerido'));
        return;
      }

      if (!Array.isArray(permisos)) {
        res.status(400).json(errorResponse('Los permisos deben ser un array de IDs'));
        return;
      }

      const result = await rolService.asignarPermisos(parseInt(id), permisos);

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al asignar permisos'));
      }
    }
  }
}
