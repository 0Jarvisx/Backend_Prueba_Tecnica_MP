import type { Request, Response } from 'express';
import { IncomingForm, Fields, Files } from 'formidable';
import path from 'path';
import fs from 'fs';
import { DocumentoService } from '../services/documento.service';
import { errorResponse, successResponse } from '../utils/formatters';

const documentoService = new DocumentoService();

export class DocumentoController {
  async subirDocumento(req: Request, res: Response): Promise<void> {
    const uploadDir = documentoService.getUploadDir();

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      multiples: false,
    });

    form.parse(req, async (err, fields: Fields, files: Files) => {
      if (err) {
        res.status(400).json(errorResponse('Error al procesar archivo: ' + err.message));
        return;
      }

      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json(errorResponse('Usuario no autenticado'));
          return;
        }

        const file = Array.isArray(files.archivo) ? files.archivo[0] : files.archivo;
        if (!file) {
          res.status(400).json(errorResponse('No se recibió ningún archivo'));
          return;
        }

        const idExpediente = Array.isArray(fields.idExpediente) ? fields.idExpediente[0] : fields.idExpediente;
        const idIndicio = Array.isArray(fields.idIndicio) ? fields.idIndicio[0] : fields.idIndicio;
        const tipoDocumento = Array.isArray(fields.tipoDocumento) ? fields.tipoDocumento[0] : fields.tipoDocumento;
        const descripcion = Array.isArray(fields.descripcion) ? fields.descripcion[0] : fields.descripcion;

        if (!idExpediente) {
          res.status(400).json(errorResponse('ID de expediente es requerido'));
          return;
        }

        // Mover archivo a subcarpeta del expediente
        const subDir = `expediente_${idExpediente}`;
        const targetDir = path.join(uploadDir, subDir);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const ext = path.extname(file.originalFilename || '');
        const nombreArchivo = `${Date.now()}_${file.originalFilename}`;
        const rutaRelativa = path.join(subDir, nombreArchivo);
        const rutaCompleta = path.join(uploadDir, rutaRelativa);

        fs.renameSync(file.filepath, rutaCompleta);

        const result = await documentoService.guardarDocumento({
          idExpediente: parseInt(idExpediente),
          idIndicio: idIndicio ? parseInt(idIndicio) : undefined,
          tipoDocumento: tipoDocumento || 'otro',
          nombreArchivo: file.originalFilename || nombreArchivo,
          rutaArchivo: rutaRelativa,
          extension: ext.replace('.', ''),
          tamanioKb: Math.round((file.size || 0) / 1024),
          idUsuarioCarga: userId,
          descripcion: descripcion || undefined,
        });

        res.status(201).json(successResponse(result, result.mensaje));
      } catch (error) {
        res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error al subir documento'));
      }
    });
  }

  async listarPorExpediente(req: Request, res: Response): Promise<void> {
    try {
      const { idExpediente } = req.params;
      const documentos = await documentoService.listarDocumentosPorExpediente(parseInt(idExpediente));
      res.status(200).json(successResponse(documentos, 'Documentos obtenidos'));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async listarPorIndicio(req: Request, res: Response): Promise<void> {
    try {
      const { idIndicio } = req.params;
      const documentos = await documentoService.listarDocumentosPorIndicio(parseInt(idIndicio));
      res.status(200).json(successResponse(documentos, 'Documentos obtenidos'));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const ipAddress = req.auditContext?.ipAddress;

      const result = await documentoService.eliminarDocumento(parseInt(id), userId, ipAddress);
      res.status(200).json(successResponse(undefined, result.mensaje));
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

  async descargar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const uploadDir = documentoService.getUploadDir();

      // Obtener info del documento
      const { prisma } = await import('../config/database');
      const docs: any[] = await prisma.$queryRawUnsafe(`
        SELECT nombre_archivo, ruta_archivo FROM documentos WHERE id_documento = ${id} AND deleted_at IS NULL
      `);

      if (docs.length === 0) {
        res.status(404).json(errorResponse('Documento no encontrado'));
        return;
      }

      const rutaCompleta = path.join(uploadDir, docs[0].ruta_archivo);
      if (!fs.existsSync(rutaCompleta)) {
        res.status(404).json(errorResponse('Archivo no encontrado en el servidor'));
        return;
      }

      res.download(rutaCompleta, docs[0].nombre_archivo);
    } catch (error) {
      res.status(400).json(errorResponse(error instanceof Error ? error.message : 'Error'));
    }
  }

}
