import { Router } from 'express';
import * as atraccionesController from '../controllers/atracciones.controller.js';

const router = Router();

router.get('/buscar', atraccionesController.buscar);
router.get('/ranking', atraccionesController.ranking);
router.get('/cercanas', atraccionesController.cercanas);
router.get('/', atraccionesController.listar);
router.post('/visita', atraccionesController.registrarVisita);
router.post('/', atraccionesController.crear);
router.put('/:id', atraccionesController.editar);
router.delete('/:id', atraccionesController.eliminar);

export default router;
