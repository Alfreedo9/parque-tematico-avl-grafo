import { parque } from '../core/Parque.js';

function validarOrigenDestino(req, res) {
  const { origen, destino } = req.query;
  if (!origen || !destino) {
    res.status(400).json({ error: 'Los parametros origen y destino son requeridos' });
    return null;
  }
  return { origen, destino };
}

export function rutaCorta(req, res) {
  const params = validarOrigenDestino(req, res);
  if (!params) return;

  try {
    const resultado = parque.rutaMasCorta(params.origen, params.destino);
    if (!resultado) return res.status(404).json({ error: 'No existe una ruta entre esas atracciones' });
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export function rutaOptima(req, res) {
  const params = validarOrigenDestino(req, res);
  if (!params) return;

  try {
    const resultado = parque.rutaOptima(params.origen, params.destino);
    if (!resultado) return res.status(404).json({ error: 'No existe una ruta entre esas atracciones' });
    res.json(resultado);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export function planificar(req, res) {
  const { origen, paradas } = req.body;
  if (!origen || !Array.isArray(paradas) || paradas.length === 0) {
    return res.status(400).json({ error: 'origen y paradas (arreglo no vacio) son requeridos' });
  }

  try {
    res.json(parque.planificarRecorrido(origen, paradas));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}
