import { Router } from 'express';
import { AsignacionController } from '../controllers/asignacion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const asignacionController = new AsignacionController();

router.use(authMiddleware);


router.get('/supervisores', (req, res) => asignacionController.listarSupervisores(req, res));

router.get('/tecnicos-disponibles', (req, res) => asignacionController.listarTecnicosSinSupervisor(req, res));

router.get('/', (req, res) => asignacionController.listarAsignaciones(req, res));

router.post('/', (req, res) => asignacionController.asignarSupervisor(req, res));

router.delete('/:id', (req, res) => asignacionController.eliminarAsignacion(req, res));

export default router;
