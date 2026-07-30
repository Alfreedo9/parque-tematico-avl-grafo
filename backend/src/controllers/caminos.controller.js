import { parque } from '../core/Parque.js';

export function listar(req, res) {
  res.json(parque.listarCaminos());
}

export async function crear(req, res) {
  const { origen, destino, tiempoCaminata } = req.body;
  if (!origen || !destino || typeof tiempoCaminata !== 'number' || tiempoCaminata < 0) {
    return res.status(400).json({ error: 'origen, destino y tiempoCaminata (numero >= 0) son requeridos' });
  }

  try {
    const camino = await parque.agregarCamino({ origen, destino, tiempoCaminata });
    res.status(201).json(camino);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
