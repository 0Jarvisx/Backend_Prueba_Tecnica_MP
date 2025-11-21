import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { errorResponse, successResponse } from '../utils/formatters';

const userService = new UserService();

export class UserController {

  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, apellido, email, dpi, telefono, idRol } = req.body;

      // Validaciones
      if (!nombre || !apellido || !email || !idRol) {
        res.status(400).json(errorResponse('Todos los campos obligatorios deben ser proporcionados'));
        return;
      }

      const result = await userService.registrarUsuario({
        nombre,
        apellido,
        email,
        dpi: dpi || null,
        telefono: telefono || null,
        idRol: parseInt(idRol),
      });

      res.status(201).json(successResponse(result, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al registrar usuario'));
      }
    }
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const { pagina, limite, busqueda, idRol, soloActivos } = req.query;

      const result = await userService.listarUsuarios({
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
        busqueda: busqueda as string,
        idRol: idRol ? parseInt(idRol as string) : undefined,
        soloActivos: soloActivos === 'false' ? false : true,
      });

      res.status(200).json(successResponse(result, 'Usuarios obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener usuarios'));
      }
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de usuario es requerido'));
        return;
      }

      const usuario = await userService.obtenerUsuario(parseInt(id));

      res.status(200).json(successResponse(usuario, 'Usuario obtenido correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener usuario'));
      }
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, apellido, email, dpi, telefono, idRol, activo } = req.body;

      if (!id) {
        res.status(400).json(errorResponse('ID de usuario es requerido'));
        return;
      }

      if (!nombre || !apellido || !email || idRol === undefined || activo === undefined) {
        res.status(400).json(errorResponse('Todos los campos obligatorios deben ser proporcionados'));
        return;
      }

      const result = await userService.actualizarUsuario(parseInt(id), {
        nombre,
        apellido,
        email,
        dpi: dpi || null,
        telefono: telefono || null,
        idRol: parseInt(idRol),
        activo: Boolean(activo),
      });

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al actualizar usuario'));
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json(errorResponse('ID de usuario es requerido'));
        return;
      }

      const result = await userService.eliminarUsuario(parseInt(id));

      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al eliminar usuario'));
      }
    }
  }

  async listRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await userService.listarRoles();

      res.status(200).json(successResponse({ roles }, 'Roles obtenidos correctamente'));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Error al obtener roles'));
      }
    }
  }
}
