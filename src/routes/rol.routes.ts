import { Router } from 'express';
import { RolController } from '../controllers/rol.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const rolController = new RolController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/roles
 * @desc    Registrar un nuevo rol 
 */
router.post('/', (req, res) => rolController.registerRole(req, res));

/**
 * @route   GET /api/roles
 * @desc    Listar roles con paginación
 */
router.get('/', (req, res) => rolController.listRoles(req, res));

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener un rol por ID con sus permisos
 */
router.get('/:id', (req, res) => rolController.getRole(req, res));

/**
 * @route   PUT /api/roles/:id
 * @desc    Actualizar un rol
 */
router.put('/:id', (req, res) => rolController.updateRole(req, res));

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar un rol
 */
router.delete('/:id', (req, res) => rolController.deleteRole(req, res));

/**
 * @route   POST /api/roles/:id/permisos
 * @desc    Asignar permisos a un rol
 */
router.post('/:id/permisos', (req, res) => rolController.assignPermissions(req, res));

export default router;
