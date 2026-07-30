import { Router } from 'express';
import * as caminosController from '../controllers/caminos.controller.js';

const router = Router();

router.get('/', caminosController.listar);
router.post('/', caminosController.crear);

export default router;
