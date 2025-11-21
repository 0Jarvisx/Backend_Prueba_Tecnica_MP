import { Router } from 'express';
import { PermisoController } from '../controllers/permiso.controller';
import { authMiddleware } from '../middlewares/auth.middleware';


const router = Router();
const permisoController = new PermisoController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/permisos
 * @desc    Registrar un nuevo permiso
 */
router.post('/', (req, res) => permisoController.registerPermission(req, res));

/**
 * @route   GET /api/permisos
 * @desc    Listar permisos con paginación
 */
router.get('/', (req, res) => permisoController.listPermissions(req, res));

/**
 * @route   GET /api/permisos/all
 * @desc    Listar todos los permisos sin paginación
 */
router.get('/all', (req, res) => permisoController.listAllPermissions(req, res));

/**
 * @route   GET /api/permisos/:id
 * @desc    Obtener un permiso por ID
 */
router.get('/:id', (req, res) => permisoController.getPermission(req, res));

/**
 * @route   PUT /api/permisos/:id
 * @desc    Actualizar un permiso
 */
router.put('/:id', (req, res) => permisoController.updatePermission(req, res));

/**
 * @route   DELETE /api/permisos/:id
 * @desc    Eliminar un permiso
 */
router.delete('/:id', (req, res) => permisoController.deletePermission(req, res));

export default router;
