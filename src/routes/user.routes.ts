import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';


const router = Router();
const userController = new UserController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/users
 * @desc    Registrar un nuevo usuario
 */
router.post('/', (req, res) => userController.registerUser(req, res));

/**
 * @route   GET /api/users
 * @desc    Listar usuarios con paginación
 */
router.get('/', (req, res) => userController.listUsers(req, res));

/**
 * @route   GET /api/users/roles
 * @desc    Listar roles activos
 */
router.get('/roles', (req, res) => userController.listRoles(req, res));

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 */
router.get('/:id', (req, res) => userController.getUser(req, res));

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario
 */
router.put('/:id', (req, res) => userController.updateUser(req, res));

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar un usuario
 */
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

export default router;
