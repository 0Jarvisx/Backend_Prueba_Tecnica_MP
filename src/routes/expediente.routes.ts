import { Router } from 'express';
import { ExpedienteController } from '../controllers/expediente.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const expedienteController = new ExpedienteController();

router.use(authMiddleware);

/**
 * @swagger
 * /expedientes:
 *   post:
 *     summary: Crear un nuevo expediente
 *     tags: [Expedientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExpediente'
 *     responses:
 *       201:
 *         description: Expediente creado exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/', (req, res) => expedienteController.createExpediente(req, res));

/**
 * @swagger
 * /expedientes/con-indicios:
 *   post:
 *     summary: Crear expediente con indicios relacionados
 *     tags: [Expedientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expediente:
 *                 $ref: '#/components/schemas/CreateExpediente'
 *               indicios:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateIndicio'
 *     responses:
 *       201:
 *         description: Expediente e indicios creados exitosamente
 */
router.post('/con-indicios', (req, res) => expedienteController.createExpedienteConIndicios(req, res));

/**
 * @swagger
 * /expedientes:
 *   get:
 *     summary: Listar expedientes con paginación y filtros
 *     tags: [Expedientes]
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
 *         name: estado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por estado (1=Pendiente, 2=Aprobado, 3=Rechazado)
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por número de expediente o caso MP
 *     responses:
 *       200:
 *         description: Lista de expedientes paginada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', (req, res) => expedienteController.listExpedientes(req, res));

/**
 * @swagger
 * /expedientes/{id}:
 *   get:
 *     summary: Obtener expediente por ID
 *     tags: [Expedientes]
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
 *         description: Detalle del expediente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expediente'
 *       404:
 *         description: Expediente no encontrado
 */
router.get('/:id', (req, res) => expedienteController.getExpediente(req, res));

/**
 * @swagger
 * /expedientes/{id}:
 *   put:
 *     summary: Actualizar expediente
 *     tags: [Expedientes]
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
 *             $ref: '#/components/schemas/CreateExpediente'
 *     responses:
 *       200:
 *         description: Expediente actualizado
 */
router.put('/:id', (req, res) => expedienteController.updateExpediente(req, res));

/**
 * @swagger
 * /expedientes/{id}:
 *   delete:
 *     summary: Eliminar expediente
 *     tags: [Expedientes]
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
 *         description: Expediente eliminado
 */
router.delete('/:id', (req, res) => expedienteController.deleteExpediente(req, res));

/**
 * @swagger
 * /expedientes/{id}/aprobar:
 *   post:
 *     summary: Aprobar expediente (solo supervisores)
 *     tags: [Expedientes]
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
 *         description: Expediente aprobado
 *       403:
 *         description: No tiene permisos para aprobar
 */
router.post('/:id/aprobar', (req, res) => expedienteController.aprobarExpediente(req, res));

/**
 * @swagger
 * /expedientes/{id}/rechazar:
 *   post:
 *     summary: Rechazar expediente (solo supervisores)
 *     tags: [Expedientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo_rechazo
 *             properties:
 *               motivo_rechazo:
 *                 type: string
 *                 description: Justificación del rechazo (requerida)
 *     responses:
 *       200:
 *         description: Expediente rechazado
 *       403:
 *         description: No tiene permisos para rechazar
 */
router.post('/:id/rechazar', (req, res) => expedienteController.rechazarExpediente(req, res));

export default router;
