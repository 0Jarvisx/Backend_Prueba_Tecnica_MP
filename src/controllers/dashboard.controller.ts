import { Request, Response, NextFunction } from 'express';
import { dashboardService, DashboardFilters } from '../services/dashboard.service';
import logger from '../utils/logger';

export class DashboardController {
  /**
   * Obtiene estadísticas generales de registros
   * GET /api/dashboard/estadisticas-registros
   */
  async obtenerEstadisticasRegistros(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DashboardFilters = {
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        idEstado: req.query.idEstado ? Number(req.query.idEstado) : undefined,
        idUnidad: req.query.idUnidad ? Number(req.query.idUnidad) : undefined,
        idFiscalia: req.query.idFiscalia ? Number(req.query.idFiscalia) : undefined,
        idTecnico: req.query.idTecnico ? Number(req.query.idTecnico) : undefined
      };

      const estadisticas = await dashboardService.obtenerEstadisticasRegistros(filters);

      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      logger.error('Error en obtenerEstadisticasRegistros:', error);
      next(error);
    }
  }

  /**
   * Obtiene estadísticas de aprobaciones y rechazos
   * GET /api/dashboard/estadisticas-aprobaciones
   */
  async obtenerEstadisticasAprobaciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DashboardFilters = {
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        idUnidad: req.query.idUnidad ? Number(req.query.idUnidad) : undefined,
        idFiscalia: req.query.idFiscalia ? Number(req.query.idFiscalia) : undefined,
        idTecnico: req.query.idTecnico ? Number(req.query.idTecnico) : undefined
      };

      const estadisticas = await dashboardService.obtenerEstadisticasAprobaciones(filters);

      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      logger.error('Error en obtenerEstadisticasAprobaciones:', error);
      next(error);
    }
  }

  /**
   * Obtiene un reporte general con todas las estadísticas
   * GET /api/dashboard/reporte-general
   */
  async obtenerReporteGeneral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DashboardFilters = {
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        idEstado: req.query.idEstado ? Number(req.query.idEstado) : undefined,
        idUnidad: req.query.idUnidad ? Number(req.query.idUnidad) : undefined,
        idFiscalia: req.query.idFiscalia ? Number(req.query.idFiscalia) : undefined,
        idTecnico: req.query.idTecnico ? Number(req.query.idTecnico) : undefined
      };

      const reporte = await dashboardService.obtenerReporteGeneral(filters);

      res.status(200).json({
        success: true,
        data: reporte
      });
    } catch (error) {
      logger.error('Error en obtenerReporteGeneral:', error);
      next(error);
    }
  }

  /**
   * Obtiene métricas de rendimiento por técnico
   * GET /api/dashboard/metricas-tecnicos
   */
  async obtenerMetricasTecnicos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DashboardFilters = {
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        idUnidad: req.query.idUnidad ? Number(req.query.idUnidad) : undefined
      };

      const metricas = await dashboardService.obtenerMetricasTecnicos(filters);

      res.status(200).json({
        success: true,
        data: metricas
      });
    } catch (error) {
      logger.error('Error en obtenerMetricasTecnicos:', error);
      next(error);
    }
  }

  /**
   * Exporta un reporte a formato específico
   * GET /api/dashboard/exportar
   */
  async exportarReporte(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const formato = req.query.formato as string || 'json';

      const filters: DashboardFilters = {
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        idEstado: req.query.idEstado ? Number(req.query.idEstado) : undefined,
        idUnidad: req.query.idUnidad ? Number(req.query.idUnidad) : undefined,
        idFiscalia: req.query.idFiscalia ? Number(req.query.idFiscalia) : undefined,
        idTecnico: req.query.idTecnico ? Number(req.query.idTecnico) : undefined
      };

      const reporte = await dashboardService.obtenerReporteGeneral(filters);

      if (formato === 'csv') {
        // Convertir a CSV
        const csvData = this.convertirACSV(reporte);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-${new Date().toISOString()}.csv`);
        res.status(200).send(csvData);
      } else {
        // Formato JSON por defecto
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-${new Date().toISOString()}.json`);
        res.status(200).json(reporte);
      }
    } catch (error) {
      logger.error('Error en exportarReporte:', error);
      next(error);
    }
  }

  /**
   * Convierte un reporte a formato CSV
   */
  private convertirACSV(reporte: any): string {
    let csv = 'Reporte de Dashboard\n\n';

    // Resumen general
    csv += 'Resumen General\n';
    csv += 'Métrica,Valor\n';
    csv += `Total Expedientes,${reporte.resumen.totalExpedientes}\n`;
    csv += `Total Indicios,${reporte.resumen.totalIndicios}\n`;
    csv += `Total Documentos,${reporte.resumen.totalDocumentos}\n`;
    csv += `Expedientes Activos,${reporte.resumen.expedientesActivos}\n`;
    csv += `Expedientes Finalizados,${reporte.resumen.expedientesFinalizados}\n\n`;

    // Estadísticas de registros por estado
    csv += 'Registros por Estado\n';
    csv += 'Estado,Cantidad,Porcentaje\n';
    reporte.estadisticasRegistros.registrosPorEstado.forEach((estado: any) => {
      csv += `${estado.nombreEstado},${estado.cantidad},${estado.porcentaje}%\n`;
    });
    csv += '\n';

    // Estadísticas de aprobaciones
    csv += 'Estadísticas de Aprobaciones\n';
    csv += 'Métrica,Valor\n';
    csv += `Total Aprobados,${reporte.estadisticasAprobaciones.totalAprobados}\n`;
    csv += `Total Rechazados,${reporte.estadisticasAprobaciones.totalRechazados}\n`;
    csv += `Total Pendientes,${reporte.estadisticasAprobaciones.totalPendientes}\n`;
    csv += `Tiempo Promedio Aprobación (días),${reporte.estadisticasAprobaciones.tiempoPromedioAprobacion}\n\n`;

    return csv;
  }
}

export const dashboardController = new DashboardController();
