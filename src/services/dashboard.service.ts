import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface DashboardFilters {
  fechaInicio?: string;
  fechaFin?: string;
  idEstado?: number;
  idUnidad?: number;
  idFiscalia?: number;
  idTecnico?: number;
}

export interface EstadisticasRegistros {
  totalRegistros: number;
  registrosPorEstado: {
    idEstado: number;
    nombreEstado: string;
    cantidad: number;
    porcentaje: number;
  }[];
  registrosPorMes: {
    mes: string;
    cantidad: number;
  }[];
  registrosPorUnidad: {
    idUnidad: number;
    nombreUnidad: string;
    cantidad: number;
  }[];
}

export interface EstadisticasAprobaciones {
  totalAprobados: number;
  totalRechazados: number;
  totalPendientes: number;
  tiempoPromedioAprobacion: number;
  aprobacionesPorMes: {
    mes: string;
    aprobados: number;
    rechazados: number;
  }[];
}

export interface ReporteGeneral {
  resumen: {
    totalExpedientes: number;
    totalIndicios: number;
    totalDocumentos: number;
    expedientesActivos: number;
    expedientesFinalizados: number;
  };
  estadisticasRegistros: EstadisticasRegistros;
  estadisticasAprobaciones: EstadisticasAprobaciones;
}

export class DashboardService {
  /**
   * Obtiene estadísticas generales de registros con filtros
   */
  async obtenerEstadisticasRegistros(filters: DashboardFilters): Promise<EstadisticasRegistros> {
    try {
      const { fechaInicio, fechaFin, idEstado, idUnidad, idFiscalia, idTecnico } = filters;

      // Construir WHERE clause dinámicamente
      const whereConditions: string[] = ['e.deleted_at IS NULL'];

      if (fechaInicio) {
        whereConditions.push(`e.fecha_registro >= '${fechaInicio}'`);
      }
      if (fechaFin) {
        whereConditions.push(`e.fecha_registro <= '${fechaFin}'`);
      }
      if (idEstado) {
        whereConditions.push(`e.id_estado = ${idEstado}`);
      }
      if (idUnidad) {
        whereConditions.push(`e.id_unidad = ${idUnidad}`);
      }
      if (idFiscalia) {
        whereConditions.push(`e.id_fiscalia = ${idFiscalia}`);
      }
      if (idTecnico) {
        whereConditions.push(`e.id_tecnico_asignado = ${idTecnico}`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Total de registros
      const totalResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM expediente e WHERE ${whereClause}`
      ) as any[];
      const totalRegistros = Number(totalResult[0]?.total || 0);

      // Registros por estado
      const registrosPorEstadoResult = await prisma.$queryRawUnsafe(
        `SELECT
          e.id_estado as idEstado,
          es.nombre_estado as nombreEstado,
          COUNT(*) as cantidad,
          CAST(COUNT(*) * 100.0 / NULLIF(${totalRegistros}, 0) AS DECIMAL(5,2)) as porcentaje
        FROM expediente e
        INNER JOIN estados es ON e.id_estado = es.id_estado
        WHERE ${whereClause}
        GROUP BY e.id_estado, es.nombre_estado
        ORDER BY cantidad DESC`
      ) as any[];

      // Registros por mes (últimos 12 meses)
      const registrosPorMesResult = await prisma.$queryRawUnsafe(
        `SELECT
          FORMAT(e.fecha_registro, 'yyyy-MM') as mes,
          COUNT(*) as cantidad
        FROM expediente e
        WHERE ${whereClause}
        GROUP BY FORMAT(e.fecha_registro, 'yyyy-MM')
        ORDER BY mes DESC`
      ) as any[];

      // Registros por unidad
      const registrosPorUnidadResult = await prisma.$queryRawUnsafe(
        `SELECT
          e.id_unidad as idUnidad,
          u.nombre_unidad as nombreUnidad,
          COUNT(*) as cantidad
        FROM expediente e
        INNER JOIN unidad u ON e.id_unidad = u.id_unidad
        WHERE ${whereClause}
        GROUP BY e.id_unidad, u.nombre_unidad
        ORDER BY cantidad DESC`
      ) as any[];

      return {
        totalRegistros,
        registrosPorEstado: registrosPorEstadoResult.map(r => ({
          idEstado: r.idEstado,
          nombreEstado: r.nombreEstado,
          cantidad: Number(r.cantidad),
          porcentaje: Number(r.porcentaje || 0)
        })),
        registrosPorMes: registrosPorMesResult.map(r => ({
          mes: r.mes,
          cantidad: Number(r.cantidad)
        })),
        registrosPorUnidad: registrosPorUnidadResult.map(r => ({
          idUnidad: r.idUnidad,
          nombreUnidad: r.nombreUnidad,
          cantidad: Number(r.cantidad)
        }))
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de registros:', error);
      throw new Error('Error al obtener estadísticas de registros');
    }
  }

  /**
   * Obtiene estadísticas de aprobaciones y rechazos
   */
  async obtenerEstadisticasAprobaciones(filters: DashboardFilters): Promise<EstadisticasAprobaciones> {
    try {
      const { fechaInicio, fechaFin, idUnidad, idFiscalia, idTecnico } = filters;

      // Construir WHERE clause dinámicamente
      const whereConditions: string[] = ['e.deleted_at IS NULL'];

      if (fechaInicio) {
        whereConditions.push(`e.fecha_registro >= '${fechaInicio}'`);
      }
      if (fechaFin) {
        whereConditions.push(`e.fecha_registro <= '${fechaFin}'`);
      }
      if (idUnidad) {
        whereConditions.push(`e.id_unidad = ${idUnidad}`);
      }
      if (idFiscalia) {
        whereConditions.push(`e.id_fiscalia = ${idFiscalia}`);
      }
      if (idTecnico) {
        whereConditions.push(`e.id_tecnico_asignado = ${idTecnico}`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Conteo por estado (asumiendo que hay estados específicos para aprobado/rechazado)
      const conteoEstadosResult = await prisma.$queryRawUnsafe(
        `SELECT
          es.nombre_estado as estado,
          COUNT(*) as cantidad
        FROM expediente e
        INNER JOIN estados es ON e.id_estado = es.id_estado
        WHERE ${whereClause}
        GROUP BY es.nombre_estado`
      ) as any[];

      let totalAprobados = 0;
      let totalRechazados = 0;
      let totalPendientes = 0;

      conteoEstadosResult.forEach(r => {
        const estado = r.estado.toLowerCase();
        const cantidad = Number(r.cantidad);

        if (estado.includes('aprobado') || estado.includes('finalizado') || estado.includes('completado')) {
          totalAprobados += cantidad;
        } else if (estado.includes('rechazado') || estado.includes('cancelado')) {
          totalRechazados += cantidad;
        } else {
          totalPendientes += cantidad;
        }
      });

      // Tiempo promedio de aprobación (en días)
      const tiempoPromedioResult = await prisma.$queryRawUnsafe(
        `SELECT
          AVG(DATEDIFF(day, e.fecha_registro, COALESCE(e.fecha_entrega_dictamen, GETDATE()))) as tiempoPromedio
        FROM expediente e
        INNER JOIN estados es ON e.id_estado = es.id_estado
        WHERE ${whereClause}
        AND (es.nombre_estado LIKE '%aprobado%' OR es.nombre_estado LIKE '%finalizado%')`
      ) as any[];

      const tiempoPromedioAprobacion = Number(tiempoPromedioResult[0]?.tiempoPromedio || 0);

      // Aprobaciones y rechazos por mes
      const aprobacionesPorMesResult = await prisma.$queryRawUnsafe(
        `SELECT
          FORMAT(e.fecha_registro, 'yyyy-MM') as mes,
          SUM(CASE WHEN es.nombre_estado LIKE '%aprobado%' OR es.nombre_estado LIKE '%finalizado%' THEN 1 ELSE 0 END) as aprobados,
          SUM(CASE WHEN es.nombre_estado LIKE '%rechazado%' OR es.nombre_estado LIKE '%cancelado%' THEN 1 ELSE 0 END) as rechazados
        FROM expediente e
        INNER JOIN estados es ON e.id_estado = es.id_estado
        WHERE ${whereClause}
        GROUP BY FORMAT(e.fecha_registro, 'yyyy-MM')
        ORDER BY mes DESC`
      ) as any[];

      return {
        totalAprobados,
        totalRechazados,
        totalPendientes,
        tiempoPromedioAprobacion,
        aprobacionesPorMes: aprobacionesPorMesResult.map(r => ({
          mes: r.mes,
          aprobados: Number(r.aprobados || 0),
          rechazados: Number(r.rechazados || 0)
        }))
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de aprobaciones:', error);
      throw new Error('Error al obtener estadísticas de aprobaciones');
    }
  }

  /**
   * Obtiene un reporte general con todas las estadísticas
   */
  async obtenerReporteGeneral(filters: DashboardFilters): Promise<ReporteGeneral> {
    try {
      const { fechaInicio, fechaFin, idEstado, idUnidad, idFiscalia, idTecnico } = filters;

      // Construir WHERE clause dinámicamente
      const whereConditions: string[] = ['e.deleted_at IS NULL'];

      if (fechaInicio) {
        whereConditions.push(`e.fecha_registro >= '${fechaInicio}'`);
      }
      if (fechaFin) {
        whereConditions.push(`e.fecha_registro <= '${fechaFin}'`);
      }
      if (idEstado) {
        whereConditions.push(`e.id_estado = ${idEstado}`);
      }
      if (idUnidad) {
        whereConditions.push(`e.id_unidad = ${idUnidad}`);
      }
      if (idFiscalia) {
        whereConditions.push(`e.id_fiscalia = ${idFiscalia}`);
      }
      if (idTecnico) {
        whereConditions.push(`e.id_tecnico_asignado = ${idTecnico}`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Resumen general - ejecutar queries por separado para evitar problemas de alias
      const totalExpedientesResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM expediente e WHERE ${whereClause}`
      ) as any[];

      const totalIndiciosResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM indicio i
         INNER JOIN expediente e ON i.id_expediente = e.id_expediente
         WHERE ${whereClause} AND i.deleted_at IS NULL`
      ) as any[];

      const totalDocumentosResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM documentos d
         INNER JOIN expediente e ON d.id_expediente = e.id_expediente
         WHERE ${whereClause} AND d.deleted_at IS NULL`
      ) as any[];

      const expedientesActivosResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM expediente e
         INNER JOIN estados es ON e.id_estado = es.id_estado
         WHERE ${whereClause}
         AND (es.nombre_estado NOT LIKE '%finalizado%' AND es.nombre_estado NOT LIKE '%completado%')`
      ) as any[];

      const expedientesFinalizadosResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM expediente e
         INNER JOIN estados es ON e.id_estado = es.id_estado
         WHERE ${whereClause}
         AND (es.nombre_estado LIKE '%finalizado%' OR es.nombre_estado LIKE '%completado%')`
      ) as any[];

      // Obtener estadísticas de registros y aprobaciones
      const [estadisticasRegistros, estadisticasAprobaciones] = await Promise.all([
        this.obtenerEstadisticasRegistros(filters),
        this.obtenerEstadisticasAprobaciones(filters)
      ]);

      return {
        resumen: {
          totalExpedientes: Number(totalExpedientesResult[0]?.total || 0),
          totalIndicios: Number(totalIndiciosResult[0]?.total || 0),
          totalDocumentos: Number(totalDocumentosResult[0]?.total || 0),
          expedientesActivos: Number(expedientesActivosResult[0]?.total || 0),
          expedientesFinalizados: Number(expedientesFinalizadosResult[0]?.total || 0)
        },
        estadisticasRegistros,
        estadisticasAprobaciones
      };
    } catch (error) {
      logger.error('Error al obtener reporte general:', error);
      throw new Error('Error al obtener reporte general');
    }
  }

  /**
   * Obtiene métricas de rendimiento por técnico
   */
  async obtenerMetricasTecnicos(filters: DashboardFilters): Promise<any[]> {
    try {
      const { fechaInicio, fechaFin, idUnidad } = filters;

      const whereConditions: string[] = ['e.deleted_at IS NULL'];

      if (fechaInicio) {
        whereConditions.push(`e.fecha_registro >= '${fechaInicio}'`);
      }
      if (fechaFin) {
        whereConditions.push(`e.fecha_registro <= '${fechaFin}'`);
      }
      if (idUnidad) {
        whereConditions.push(`e.id_unidad = ${idUnidad}`);
      }

      const whereClause = whereConditions.join(' AND ');

      const metricasResult = await prisma.$queryRawUnsafe(
        `SELECT
          u.id_usuario as idTecnico,
          u.nombre + ' ' + u.apellido as nombreTecnico,
          COUNT(e.id_expediente) as totalExpedientes,
          SUM(CASE WHEN es.nombre_estado LIKE '%finalizado%' OR es.nombre_estado LIKE '%completado%' THEN 1 ELSE 0 END) as expedientesFinalizados,
          SUM(CASE WHEN e.fecha_entrega_dictamen IS NOT NULL THEN 1 ELSE 0 END) as expedientesConDictamen,
          AVG(DATEDIFF(day, e.fecha_registro, COALESCE(e.fecha_entrega_dictamen, GETDATE()))) as tiempoPromedioResolucion
        FROM expediente e
        INNER JOIN usuarios u ON e.id_tecnico_asignado = u.id_usuario
        INNER JOIN estados es ON e.id_estado = es.id_estado
        WHERE ${whereClause}
        GROUP BY u.id_usuario, u.nombre, u.apellido
        ORDER BY totalExpedientes DESC`
      ) as any[];

      return metricasResult.map(r => ({
        idTecnico: r.idTecnico,
        nombreTecnico: r.nombreTecnico,
        totalExpedientes: Number(r.totalExpedientes),
        expedientesFinalizados: Number(r.expedientesFinalizados || 0),
        expedientesConDictamen: Number(r.expedientesConDictamen || 0),
        tiempoPromedioResolucion: Number(r.tiempoPromedioResolucion || 0)
      }));
    } catch (error) {
      logger.error('Error al obtener métricas de técnicos:', error);
      throw new Error('Error al obtener métricas de técnicos');
    }
  }
}

export const dashboardService = new DashboardService();
