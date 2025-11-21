import { prisma } from '../config/database';
import { bitacoraService, TipoEntidad } from './bitacora.service';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Crear directorio si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class DocumentoService {
  async guardarDocumento(data: {
    idExpediente: number;
    idIndicio?: number;
    tipoDocumento: string;
    nombreArchivo: string;
    rutaArchivo: string;
    extension: string;
    tamanioKb: number;
    idUsuarioCarga: number;
    descripcion?: string;
    ipAddress?: string;
  }) {
    const result: any[] = await prisma.$queryRawUnsafe(`
      INSERT INTO documentos (
        id_expediente, id_indicio, tipo_documento, nombre_archivo,
        ruta_archivo, extension, tamanio_kb, id_usuario_carga,
        fecha_carga, descripcion, version, created_at, updated_at
      )
      OUTPUT INSERTED.id_documento
      VALUES (
        ${data.idExpediente},
        ${data.idIndicio || 'NULL'},
        '${data.tipoDocumento}',
        '${data.nombreArchivo}',
        '${data.rutaArchivo}',
        '${data.extension}',
        ${data.tamanioKb},
        ${data.idUsuarioCarga},
        GETDATE(),
        ${data.descripcion ? `'${data.descripcion}'` : 'NULL'},
        1,
        GETDATE(),
        GETDATE()
      )
    `);

    // Registrar en bitácora
    await bitacoraService.registrarCargaDocumento({
      idExpediente: data.idExpediente,
      idIndicio: data.idIndicio,
      idUsuario: data.idUsuarioCarga,
      nombreArchivo: data.nombreArchivo,
      tipoDocumento: data.tipoDocumento,
      ipAddress: data.ipAddress
    });

    return { id: result[0]?.id_documento, mensaje: 'Documento guardado correctamente' };
  }

  async listarDocumentosPorExpediente(idExpediente: number) {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        d.id_documento, d.id_expediente, d.id_indicio, d.tipo_documento,
        d.nombre_archivo, d.ruta_archivo, d.extension, d.tamanio_kb,
        d.id_usuario_carga, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
        d.fecha_carga, d.descripcion, d.version
      FROM documentos d
      INNER JOIN usuarios u ON d.id_usuario_carga = u.id_usuario
      WHERE d.id_expediente = ${idExpediente} AND d.deleted_at IS NULL
      ORDER BY d.fecha_carga DESC
    `);
    return result;
  }

  async listarDocumentosPorIndicio(idIndicio: number) {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        d.id_documento, d.id_expediente, d.id_indicio, d.tipo_documento,
        d.nombre_archivo, d.ruta_archivo, d.extension, d.tamanio_kb,
        d.id_usuario_carga, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
        d.fecha_carga, d.descripcion, d.version
      FROM documentos d
      INNER JOIN usuarios u ON d.id_usuario_carga = u.id_usuario
      WHERE d.id_indicio = ${idIndicio} AND d.deleted_at IS NULL
      ORDER BY d.fecha_carga DESC
    `);
    return result;
  }

  async eliminarDocumento(idDocumento: number, idUsuarioEliminador: number, ipAddress?: string) {
    // Obtener info del documento para eliminar archivo físico
    const docs: any[] = await prisma.$queryRawUnsafe(`
      SELECT d.ruta_archivo, d.nombre_archivo, d.id_expediente, d.id_indicio
      FROM documentos d
      WHERE d.id_documento = ${idDocumento} AND d.deleted_at IS NULL
    `);

    if (docs.length === 0) {
      throw new Error('Documento no encontrado');
    }

    // Soft delete
    await prisma.$queryRawUnsafe(`
      UPDATE documentos SET deleted_at = GETDATE() WHERE id_documento = ${idDocumento}
    `);

    // Eliminar archivo físico
    const rutaCompleta = path.join(UPLOAD_DIR, docs[0].ruta_archivo);
    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
    }

    // Registrar en bitácora
    await bitacoraService.registrarEliminacion({
      tipoEntidad: TipoEntidad.DOCUMENTO,
      idEntidad: idDocumento,
      idExpediente: docs[0].id_expediente,
      idIndicio: docs[0].id_indicio,
      idUsuario: idUsuarioEliminador,
      descripcion: `Documento eliminado: ${docs[0].nombre_archivo}`,
      ipAddress,
      detalles: {
        nombreArchivo: docs[0].nombre_archivo,
        rutaArchivo: docs[0].ruta_archivo
      }
    });

    return { mensaje: 'Documento eliminado correctamente' };
  }

  getUploadDir() {
    return UPLOAD_DIR;
  }
}
