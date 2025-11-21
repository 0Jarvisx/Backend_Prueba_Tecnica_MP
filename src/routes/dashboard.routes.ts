import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/dashboard/estadisticas-registros:
 *   get:
 *     summary: Obtiene estadísticas generales de registros
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: idEstado
 *         schema:
 *           type: integer
 *         description: ID del estado para filtrar
 *       - in: query
 *         name: idUnidad
 *         schema:
 *           type: integer
 *         description: ID de la unidad para filtrar
 *       - in: query
 *         name: idFiscalia
 *         schema:
 *           type: integer
 *         description: ID de la fiscalía para filtrar
 *       - in: query
 *         name: idTecnico
 *         schema:
 *           type: integer
 *         description: ID del técnico para filtrar
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/estadisticas-registros',
  authMiddleware,
  dashboardController.obtenerEstadisticasRegistros.bind(dashboardController)
);

/**
 * @swagger
 * /api/dashboard/estadisticas-aprobaciones:
 *   get:
 *     summary: Obtiene estadísticas de aprobaciones y rechazos
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: idUnidad
 *         schema:
 *           type: integer
 *         description: ID de la unidad para filtrar
 *       - in: query
 *         name: idFiscalia
 *         schema:
 *           type: integer
 *         description: ID de la fiscalía para filtrar
 *       - in: query
 *         name: idTecnico
 *         schema:
 *           type: integer
 *         description: ID del técnico para filtrar
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/estadisticas-aprobaciones',
  authMiddleware,
  dashboardController.obtenerEstadisticasAprobaciones.bind(dashboardController)
);

/**
 * @swagger
 * /api/dashboard/reporte-general:
 *   get:
 *     summary: Obtiene un reporte general con todas las estadísticas
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: idEstado
 *         schema:
 *           type: integer
 *         description: ID del estado para filtrar
 *       - in: query
 *         name: idUnidad
 *         schema:
 *           type: integer
 *         description: ID de la unidad para filtrar
 *       - in: query
 *         name: idFiscalia
 *         schema:
 *           type: integer
 *         description: ID de la fiscalía para filtrar
 *       - in: query
 *         name: idTecnico
 *         schema:
 *           type: integer
 *         description: ID del técnico para filtrar
 *     responses:
 *       200:
 *         description: Reporte obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/reporte-general',
  authMiddleware,
  dashboardController.obtenerReporteGeneral.bind(dashboardController)
);

/**
 * @swagger
 * /api/dashboard/metricas-tecnicos:
 *   get:
 *     summary: Obtiene métricas de rendimiento por técnico
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: idUnidad
 *         schema:
 *           type: integer
 *         description: ID de la unidad para filtrar
 *     responses:
 *       200:
 *         description: Métricas obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/metricas-tecnicos',
  authMiddleware,
  dashboardController.obtenerMetricasTecnicos.bind(dashboardController)
);

/**
 * @swagger
 * /api/dashboard/exportar:
 *   get:
 *     summary: Exporta un reporte a formato específico (JSON o CSV)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Formato de exportación (json o csv)
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del filtro (YYYY-MM-DD)
 *       - in: query
 *         name: idEstado
 *         schema:
 *           type: integer
 *         description: ID del estado para filtrar
 *       - in: query
 *         name: idUnidad
 *         schema:
 *           type: integer
 *         description: ID de la unidad para filtrar
 *       - in: query
 *         name: idFiscalia
 *         schema:
 *           type: integer
 *         description: ID de la fiscalía para filtrar
 *       - in: query
 *         name: idTecnico
 *         schema:
 *           type: integer
 *         description: ID del técnico para filtrar
 *     responses:
 *       200:
 *         description: Reporte exportado exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/exportar',
  authMiddleware,
  dashboardController.exportarReporte.bind(dashboardController)
);

export default router;
