import { parque } from '../core/Parque.js';

export function buscar(req, res) {
  const { nombre = '' } = req.query;
  res.json(parque.buscarPorNombre(nombre));
}

export function ranking(req, res) {
  const top = Number.parseInt(req.query.top, 10) || 5;
  res.json(parque.ranking(top));
}

export function listar(req, res) {
  res.json(parque.listarTodas());
}

export function cercanas(req, res) {
  const { id, limite } = req.query;
  if (!id) return res.status(400).json({ error: 'El parametro id es requerido' });
  const limiteNum = Number.parseFloat(limite);
  if (Number.isNaN(limiteNum) || limiteNum < 0) {
    return res.status(400).json({ error: 'El parametro limite debe ser un numero positivo' });
  }

  try {
    res.json(parque.atraccionesCercanas(id, limiteNum));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function registrarVisita(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'El campo id es requerido' });

  try {
    const atraccion = await parque.registrarVisita(id);
    res.json(atraccion);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function crear(req, res) {
  const { nombre, zona, popularidad, tiempoEsperaFila, coordenadas } = req.body;
  if (!nombre || !zona || !coordenadas || typeof coordenadas.x !== 'number' || typeof coordenadas.y !== 'number') {
    return res.status(400).json({ error: 'nombre, zona y coordenadas {x,y} son requeridos' });
  }

  try {
    const atraccion = await parque.crearAtraccion({ nombre, zona, popularidad, tiempoEsperaFila, coordenadas });
    res.status(201).json(atraccion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function editar(req, res) {
  const { id } = req.params;
  const { nombre, zona, tiempoEsperaFila, coordenadas } = req.body;

  if (nombre !== undefined && !nombre.trim()) {
    return res.status(400).json({ error: 'nombre no puede estar vacio' });
  }
  if (coordenadas !== undefined && (typeof coordenadas.x !== 'number' || typeof coordenadas.y !== 'number')) {
    return res.status(400).json({ error: 'coordenadas debe incluir x e y numericos' });
  }
  if (tiempoEsperaFila !== undefined && (typeof tiempoEsperaFila !== 'number' || tiempoEsperaFila < 0)) {
    return res.status(400).json({ error: 'tiempoEsperaFila debe ser un numero >= 0' });
  }

  try {
    const atraccion = await parque.editarAtraccion(id, { nombre, zona, tiempoEsperaFila, coordenadas });
    res.json(atraccion);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe una atraccion con ese nombre' });
    res.status(404).json({ error: err.message });
  }
}

export async function eliminar(req, res) {
  const { id } = req.params;

  try {
    await parque.eliminarAtraccion(id);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}
