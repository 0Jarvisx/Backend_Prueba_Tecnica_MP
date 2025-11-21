import { Router } from 'express';
import { IndicioController } from '../controllers/indicio.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const indicioController = new IndicioController();

router.use(authMiddleware);

/**
 * @swagger
 * /indicios:
 *   post:
 *     summary: Crear un nuevo indicio
 *     tags: [Indicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIndicio'
 *     responses:
 *       201:
 *         description: Indicio creado exitosamente
 */
router.post('/', (req, res) => indicioController.createIndicio(req, res));

/**
 * @swagger
 * /indicios:
 *   get:
 *     summary: Listar indicios con paginación
 *     tags: [Indicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: expediente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por expediente
 *     responses:
 *       200:
 *         description: Lista de indicios paginada
 */
router.get('/', (req, res) => indicioController.listIndicios(req, res));

/**
 * @swagger
 * /indicios/{id}:
 *   get:
 *     summary: Obtener indicio por ID
 *     tags: [Indicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del indicio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Indicio'
 */
router.get('/:id', (req, res) => indicioController.getIndicio(req, res));

/**
 * @swagger
 * /indicios/{id}:
 *   put:
 *     summary: Actualizar indicio
 *     tags: [Indicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIndicio'
 *     responses:
 *       200:
 *         description: Indicio actualizado
 */
router.put('/:id', (req, res) => indicioController.updateIndicio(req, res));

/**
 * @swagger
 * /indicios/{id}:
 *   delete:
 *     summary: Eliminar indicio
 *     tags: [Indicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Indicio eliminado
 */
router.delete('/:id', (req, res) => indicioController.deleteIndicio(req, res));

export default router;
