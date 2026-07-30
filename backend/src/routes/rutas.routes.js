import { Router } from 'express';
import * as rutasController from '../controllers/rutas.controller.js';

const router = Router();

router.get('/corta', rutasController.rutaCorta);
router.get('/optima', rutasController.rutaOptima);
router.post('/planificar', rutasController.planificar);

export default router;
