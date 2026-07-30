const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function solicitar(path, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Esta corriendo el backend?', 0);
  }

  let cuerpo = null;
  const texto = await respuesta.text();
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = null;
    }
  }

  if (!respuesta.ok) {
    throw new ApiError(cuerpo?.error || `Error ${respuesta.status}`, respuesta.status);
  }

  return cuerpo;
}

function query(params) {
  const usp = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') usp.set(clave, valor);
  }
  const texto = usp.toString();
  return texto ? `?${texto}` : '';
}

export const api = {
  listarAtracciones: () => solicitar('/atracciones'),
  buscarAtracciones: (nombre) => solicitar(`/atracciones/buscar${query({ nombre })}`),
  ranking: (top) => solicitar(`/atracciones/ranking${query({ top })}`),
  cercanas: (id, limite) => solicitar(`/atracciones/cercanas${query({ id, limite })}`),
  registrarVisita: (id) => solicitar('/atracciones/visita', { method: 'POST', body: JSON.stringify({ id }) }),
  crearAtraccion: (datos) => solicitar('/atracciones', { method: 'POST', body: JSON.stringify(datos) }),
  editarAtraccion: (id, datos) => solicitar(`/atracciones/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  eliminarAtraccion: (id) => solicitar(`/atracciones/${id}`, { method: 'DELETE' }),

  listarCaminos: () => solicitar('/caminos'),
  crearCamino: (datos) => solicitar('/caminos', { method: 'POST', body: JSON.stringify(datos) }),

  rutaCorta: (origen, destino) => solicitar(`/rutas/corta${query({ origen, destino })}`),
  rutaOptima: (origen, destino) => solicitar(`/rutas/optima${query({ origen, destino })}`),
  planificar: (origen, paradas) =>
    solicitar('/rutas/planificar', { method: 'POST', body: JSON.stringify({ origen, paradas }) }),
};

export { ApiError };
