import { Router } from 'express';
import { DocumentoController } from '../controllers/documento.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const documentoController = new DocumentoController();

router.use(authMiddleware);

router.post('/', (req, res) => documentoController.subirDocumento(req, res));

router.get('/expediente/:idExpediente', (req, res) => documentoController.listarPorExpediente(req, res));

router.get('/indicio/:idIndicio', (req, res) => documentoController.listarPorIndicio(req, res));

router.get('/:id/descargar', (req, res) => documentoController.descargar(req, res));

router.delete('/:id', (req, res) => documentoController.eliminar(req, res));

export default router;
