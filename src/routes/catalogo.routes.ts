import { Router } from 'express';
import { CatalogoController } from '../controllers/catalogo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const catalogoController = new CatalogoController();

router.use(authMiddleware);

/**
 * @swagger
 * /catalogos/estados-expediente:
 *   get:
 *     summary: Listar estados de expediente
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados (Pendiente, Aprobado, Rechazado)
 */
router.get('/estados-expediente', (req, res) => catalogoController.getEstadosExpediente(req, res));

/**
 * @swagger
 * /catalogos/estados-indicio:
 *   get:
 *     summary: Listar estados de indicio
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados de indicio
 */
router.get('/estados-indicio', (req, res) => catalogoController.getEstadosIndicio(req, res));

/**
 * @swagger
 * /catalogos/unidades:
 *   get:
 *     summary: Listar unidades forenses
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de unidades (Balística, Documentoscopía, etc.)
 */
router.get('/unidades', (req, res) => catalogoController.getUnidades(req, res));

/**
 * @swagger
 * /catalogos/fiscalias:
 *   get:
 *     summary: Listar fiscalías
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fiscalías del MP
 */
router.get('/fiscalias', (req, res) => catalogoController.getFiscalias(req, res));

/**
 * @swagger
 * /catalogos/tecnicos:
 *   get:
 *     summary: Listar técnicos disponibles
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de técnicos activos
 */
router.get('/tecnicos', (req, res) => catalogoController.getTecnicos(req, res));

/**
 * @swagger
 * /catalogos/departamentos:
 *   get:
 *     summary: Listar departamentos de Guatemala
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de los 22 departamentos de Guatemala
 */
router.get('/departamentos', (req, res) => catalogoController.getDepartamentos(req, res));

/**
 * @swagger
 * /catalogos/municipios/{idDepartamento}:
 *   get:
 *     summary: Listar municipios por departamento
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idDepartamento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del departamento
 *     responses:
 *       200:
 *         description: Lista de municipios del departamento
 *       400:
 *         description: ID de departamento inválido
 */
router.get('/municipios/:idDepartamento', (req, res) => catalogoController.getMunicipiosByDepartamento(req, res));

export default router;
