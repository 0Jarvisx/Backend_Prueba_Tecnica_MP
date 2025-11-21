import { prisma } from '../config/database';
import { bitacoraService, TipoEntidad } from './bitacora.service';
import type {
  CrearIndicioResult,
  ListarIndiciosResult,
  ObtenerIndicioResult,
  ActualizarIndicioResult,
  EliminarIndicioResult,
} from '../types/stored-procedures';

export class IndicioService {
  /**
   * Crear un nuevo indicio
   */
  async crearIndicio(data: {
    idExpediente: number;
    numeroIndicio: string;
    descripcion: string;
    tipoObjeto?: string;
    color?: string;
    tamanio?: string;
    peso?: number;
    pesoUnidad?: string;
    ubicacionHallazgo?: string;
    idTecnicoRegistro: number;
    idEstadoIndicio: number;
    observaciones?: string;
    cantidad?: number;
    ipAddress?: string;
  }): Promise<{ id_indicio: number; mensaje: string }> {
    const result: CrearIndicioResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_crear_indicio
        @idExpediente = ${data.idExpediente},
        @numeroIndicio = N'${data.numeroIndicio}',
        @descripcion = N'${data.descripcion.replace(/'/g, "''")}',
        @tipoObjeto = ${data.tipoObjeto ? `N'${data.tipoObjeto}'` : 'NULL'},
        @color = ${data.color ? `N'${data.color}'` : 'NULL'},
        @tamanio = ${data.tamanio ? `N'${data.tamanio}'` : 'NULL'},
        @peso = ${data.peso || 'NULL'},
        @pesoUnidad = ${data.pesoUnidad ? `N'${data.pesoUnidad}'` : 'NULL'},
        @ubicacionHallazgo = ${data.ubicacionHallazgo ? `N'${data.ubicacionHallazgo}'` : 'NULL'},
        @idTecnicoRegistro = ${data.idTecnicoRegistro},
        @idEstadoIndicio = ${data.idEstadoIndicio},
        @observaciones = ${data.observaciones ? `N'${data.observaciones.replace(/'/g, "''")}'` : 'NULL'},
        @cantidad = ${data.cantidad || 1}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al crear indicio');
    }

    // Registrar en bitácora
    await bitacoraService.registrarCreacion({
      tipoEntidad: TipoEntidad.INDICIO,
      idEntidad: result[0].id_indicio!,
      idExpediente: data.idExpediente,
      idIndicio: result[0].id_indicio!,
      idUsuario: data.idTecnicoRegistro,
      descripcion: `Indicio creado: ${data.numeroIndicio}`,
      ipAddress: data.ipAddress,
      detalles: {
        numeroIndicio: data.numeroIndicio,
        descripcion: data.descripcion,
        tipoObjeto: data.tipoObjeto,
        cantidad: data.cantidad
      }
    });

    return {
      id_indicio: result[0].id_indicio!,
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Listar indicios con paginación y filtro por rol
   */
  async listarIndicios(params: {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    idExpediente?: number;
    idEstadoIndicio?: number;
    idUsuario?: number;
    rolUsuario?: string;
    soloActivos?: boolean;
  }): Promise<{
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
    indicios: any[];
  }> {
    const pagina = params.pagina || 1;
    const limite = params.limite || 10;
    const busqueda = params.busqueda || null;
    const soloActivos = params.soloActivos !== undefined ? (params.soloActivos ? 1 : 0) : 1;

    const result: ListarIndiciosResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_listar_indicios
        @pagina = ${pagina},
        @limite = ${limite},
        @busqueda = ${busqueda ? `N'${busqueda}'` : 'NULL'},
        @idExpediente = ${params.idExpediente || 'NULL'},
        @idEstadoIndicio = ${params.idEstadoIndicio || 'NULL'},
        @idUsuario = ${params.idUsuario || 'NULL'},
        @rolUsuario = ${params.rolUsuario ? `N'${params.rolUsuario}'` : 'NULL'},
        @soloActivos = ${soloActivos}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener indicios');
    }

    const indicios = result[0].indicios ? JSON.parse(result[0].indicios) : [];

    return {
      total: result[0].total,
      pagina: result[0].pagina,
      limite: result[0].limite,
      total_paginas: result[0].total_paginas,
      indicios,
    };
  }

  /**
   * Obtener un indicio por ID con validación de permisos
   */
  async obtenerIndicio(
    idIndicio: number,
    idUsuario?: number,
    rolUsuario?: string
  ): Promise<ObtenerIndicioResult> {
    const result: ObtenerIndicioResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_obtener_indicio
        @idIndicio = ${idIndicio},
        @idUsuario = ${idUsuario || 'NULL'},
        @rolUsuario = ${rolUsuario ? `N'${rolUsuario}'` : 'NULL'}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Indicio no encontrado');
    }

    return result[0];
  }

  /**
   * Actualizar un indicio
   */
  async actualizarIndicio(
    idIndicio: number,
    data: {
      numeroIndicio: string;
      descripcion: string;
      tipoObjeto?: string;
      color?: string;
      tamanio?: string;
      peso?: number;
      pesoUnidad?: string;
      ubicacionHallazgo?: string;
      idEstadoIndicio: number;
      observaciones?: string;
      cantidad?: number;
      idUsuarioModificador: number;
      ipAddress?: string;
    }
  ): Promise<any> {
    // Obtener datos anteriores
    const indicioAnterior = await this.obtenerIndicio(idIndicio);
    const result: ActualizarIndicioResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_actualizar_indicio
        @idIndicio = ${idIndicio},
        @numeroIndicio = N'${data.numeroIndicio}',
        @descripcion = N'${data.descripcion.replace(/'/g, "''")}',
        @tipoObjeto = ${data.tipoObjeto ? `N'${data.tipoObjeto}'` : 'NULL'},
        @color = ${data.color ? `N'${data.color}'` : 'NULL'},
        @tamanio = ${data.tamanio ? `N'${data.tamanio}'` : 'NULL'},
        @peso = ${data.peso || 'NULL'},
        @pesoUnidad = ${data.pesoUnidad ? `N'${data.pesoUnidad}'` : 'NULL'},
        @ubicacionHallazgo = ${data.ubicacionHallazgo ? `N'${data.ubicacionHallazgo}'` : 'NULL'},
        @idEstadoIndicio = ${data.idEstadoIndicio},
        @observaciones = ${data.observaciones ? `N'${data.observaciones.replace(/'/g, "''")}'` : 'NULL'},
        @cantidad = ${data.cantidad || 1}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al actualizar indicio');
    }

    // Registrar en bitácora
    await bitacoraService.registrarActualizacion({
      tipoEntidad: TipoEntidad.INDICIO,
      idEntidad: idIndicio,
      idExpediente: indicioAnterior.id_expediente,
      idIndicio,
      idUsuario: data.idUsuarioModificador,
      descripcion: `Indicio actualizado: ${data.numeroIndicio}`,
      ipAddress: data.ipAddress,
      valoresAnteriores: {
        descripcion: indicioAnterior.descripcion,
        estado: indicioAnterior.id_estado_indicio
      },
      valoresNuevos: {
        descripcion: data.descripcion,
        estado: data.idEstadoIndicio
      }
    });

    return {
      mensaje: result[0].mensaje,
    };
  }

  /**
   * Eliminar un indicio (soft delete)
   */
  async eliminarIndicio(idIndicio: number, idUsuarioEliminador: number, ipAddress?: string): Promise<{ mensaje: string }> {
    // Obtener datos del indicio antes de eliminar
    const indicio = await this.obtenerIndicio(idIndicio);
    const result: EliminarIndicioResult[] = await prisma.$queryRawUnsafe(
      `EXEC pr_eliminar_indicio @idIndicio = ${idIndicio}`
    );

    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al eliminar indicio');
    }

    // Registrar en bitácora
    await bitacoraService.registrarEliminacion({
      tipoEntidad: TipoEntidad.INDICIO,
      idEntidad: idIndicio,
      idExpediente: indicio.id_expediente,
      idIndicio,
      idUsuario: idUsuarioEliminador,
      descripcion: `Indicio eliminado: ${indicio.numero_indicio}`,
      ipAddress,
      detalles: {
        numeroIndicio: indicio.numero_indicio,
        descripcion: indicio.descripcion
      }
    });

    return {
      mensaje: result[0].mensaje,
    };
  }
}
