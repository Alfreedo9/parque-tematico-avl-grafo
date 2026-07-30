import { AVLTree } from '../structures/AVLTree.js';
import { GrafoParque } from '../structures/GrafoParque.js';
import Atraccion from '../models/Atraccion.js';
import Camino from '../models/Camino.js';

/**
 * Orquestador central. Carga el estado desde MongoDB una sola vez al iniciar
 * el servidor y desde ahi TODA la logica (busqueda, ranking, rutas) se
 * resuelve exclusivamente contra las estructuras en memoria (AVL + Grafo).
 * MongoDB solo se vuelve a tocar en escritura (write-through) cuando algo
 * cambia, nunca para responder una consulta.
 */
class Parque {
  constructor() {
    this.avlPorNombre = null; // clave: nombre (string, unico) -> Atraccion
    this.avlPorPopularidad = null; // clave: {popularidad, id} -> Atraccion
    this.grafo = null;
    this.cargado = false;
  }

  _mapDoc(doc) {
    return {
      id: doc._id.toString(),
      nombre: doc.nombre,
      zona: doc.zona,
      popularidad: doc.popularidad,
      tiempoEsperaFila: doc.tiempoEsperaFila,
      coordenadas: doc.coordenadas,
    };
  }

  async cargar() {
    this.avlPorNombre = new AVLTree((a, b) => a.localeCompare(b));
    this.avlPorPopularidad = new AVLTree(
      (a, b) => (a.popularidad - b.popularidad) || a.id.localeCompare(b.id)
    );
    this.grafo = new GrafoParque();

    const [atraccionesDB, caminosDB] = await Promise.all([
      Atraccion.find().lean(),
      Camino.find().lean(),
    ]);

    for (const doc of atraccionesDB) {
      const atraccion = this._mapDoc(doc);
      this.avlPorNombre.insert(atraccion.nombre, atraccion);
      this.avlPorPopularidad.insert({ popularidad: atraccion.popularidad, id: atraccion.id }, atraccion);
      this.grafo.agregarNodo(atraccion);
    }

    for (const camino of caminosDB) {
      this.grafo.agregarArista(camino.origen.toString(), camino.destino.toString(), camino.tiempoCaminata);
    }

    this.cargado = true;
    console.log(
      `[parque] Cargado en memoria: ${atraccionesDB.length} atracciones, ${caminosDB.length} caminos. ` +
        `Altura AVL(nombre)=${this.avlPorNombre.getHeight()}, altura AVL(popularidad)=${this.avlPorPopularidad.getHeight()}`
    );
  }

  _asegurarCargado() {
    if (!this.cargado) throw new Error('El parque aun no ha sido cargado en memoria');
  }

  // ---------- lectura: busqueda y ranking (AVL) ----------

  buscarPorNombre(query) {
    this._asegurarCargado();
    const q = (query || '').trim();
    if (!q) return [];

    const exacta = this.avlPorNombre.search(q);
    if (exacta) return [exacta];

    const qMin = q.toLowerCase();
    return this.avlPorNombre
      .inOrder()
      .map((n) => n.value)
      .filter((a) => a.nombre.toLowerCase().includes(qMin));
  }

  ranking(top = 5) {
    this._asegurarCargado();
    return this.avlPorPopularidad.topN(top).map((n) => n.value);
  }

  listarTodas() {
    this._asegurarCargado();
    return this.avlPorNombre.inOrder().map((n) => n.value);
  }

  obtenerPorId(id) {
    this._asegurarCargado();
    return this.grafo.obtenerNodo(id) || null;
  }

  // ---------- lectura: rutas y cercania (Grafo) ----------

  _enriquecer(resultado) {
    if (!resultado) return null;
    const pasos = resultado.camino.map((id) => this.grafo.obtenerNodo(id));
    return { distanciaTotal: resultado.distanciaTotal, pasos };
  }

  rutaMasCorta(origenId, destinoId) {
    this._asegurarCargado();
    return this._enriquecer(this.grafo.rutaMasCorta(origenId, destinoId));
  }

  rutaOptima(origenId, destinoId) {
    this._asegurarCargado();
    return this._enriquecer(this.grafo.rutaOptima(origenId, destinoId));
  }

  atraccionesCercanas(id, limite) {
    this._asegurarCargado();
    return this.grafo.atraccionesCercanas(id, limite).map((c) => ({
      ...this.grafo.obtenerNodo(c.id),
      distancia: c.distancia,
    }));
  }

  listarCaminos() {
    this._asegurarCargado();
    return this.grafo.listaAristas().map((a) => ({
      origen: this.grafo.obtenerNodo(a.origen),
      destino: this.grafo.obtenerNodo(a.destino),
      tiempoCaminata: a.tiempoCaminata,
    }));
  }

  planificarRecorrido(origenId, paradasId) {
    this._asegurarCargado();
    const resultado = this.grafo.planificarRecorrido(origenId, paradasId, { incluirEspera: true });
    return {
      ...resultado,
      ordenVisita: resultado.ordenVisita.map((id) => this.grafo.obtenerNodo(id)),
      tramos: resultado.tramos.map((t) => ({
        desde: this.grafo.obtenerNodo(t.desde),
        hasta: this.grafo.obtenerNodo(t.hasta),
        distanciaTotal: t.distanciaTotal,
        pasos: t.camino.map((id) => this.grafo.obtenerNodo(id)),
      })),
      noAlcanzadas: resultado.noAlcanzadas.map((id) => this.grafo.obtenerNodo(id)),
    };
  }

  // ---------- escritura: write-through a MongoDB + estructuras en memoria ----------

  async registrarVisita(id) {
    this._asegurarCargado();
    const actual = this.grafo.obtenerNodo(id);
    if (!actual) throw new Error('Atraccion no encontrada');

    const popularidadAnterior = actual.popularidad;
    const nuevaPopularidad = popularidadAnterior + 1;

    const doc = await Atraccion.findByIdAndUpdate(id, { popularidad: nuevaPopularidad }, { new: true }).lean();
    if (!doc) throw new Error('Atraccion no encontrada en la base de datos');
    const atraccionActualizada = this._mapDoc(doc);

    // No se muta la clave in-place: se elimina el nodo con la clave vieja y se reinserta con la nueva.
    this.avlPorPopularidad.delete({ popularidad: popularidadAnterior, id });
    this.avlPorPopularidad.insert({ popularidad: nuevaPopularidad, id }, atraccionActualizada);
    this.avlPorNombre.insert(atraccionActualizada.nombre, atraccionActualizada);
    this.grafo.actualizarNodo(id, { popularidad: nuevaPopularidad });

    return atraccionActualizada;
  }

  async editarAtraccion(id, cambios) {
    this._asegurarCargado();
    const actual = this.grafo.obtenerNodo(id);
    if (!actual) throw new Error('Atraccion no encontrada');

    const actualizacion = {};
    if (cambios.nombre !== undefined) actualizacion.nombre = cambios.nombre;
    if (cambios.zona !== undefined) actualizacion.zona = cambios.zona;
    if (cambios.tiempoEsperaFila !== undefined) actualizacion.tiempoEsperaFila = cambios.tiempoEsperaFila;
    if (cambios.coordenadas !== undefined) actualizacion.coordenadas = cambios.coordenadas;

    const doc = await Atraccion.findByIdAndUpdate(id, actualizacion, { new: true, runValidators: true }).lean();
    if (!doc) throw new Error('Atraccion no encontrada en la base de datos');
    const atraccionActualizada = this._mapDoc(doc);

    // El nombre es la clave del AVL(nombre): si cambio, se elimina la clave
    // vieja antes de reinsertar; si no cambio, insert() solo refresca el valor.
    if (actualizacion.nombre !== undefined && actualizacion.nombre !== actual.nombre) {
      this.avlPorNombre.delete(actual.nombre);
    }
    this.avlPorNombre.insert(atraccionActualizada.nombre, atraccionActualizada);
    this.avlPorPopularidad.insert({ popularidad: atraccionActualizada.popularidad, id }, atraccionActualizada);
    this.grafo.actualizarNodo(id, actualizacion);

    return atraccionActualizada;
  }

  async eliminarAtraccion(id) {
    this._asegurarCargado();
    const actual = this.grafo.obtenerNodo(id);
    if (!actual) throw new Error('Atraccion no encontrada');

    await Atraccion.findByIdAndDelete(id);
    await Camino.deleteMany({ $or: [{ origen: id }, { destino: id }] });

    this.avlPorNombre.delete(actual.nombre);
    this.avlPorPopularidad.delete({ popularidad: actual.popularidad, id });
    this.grafo.eliminarNodo(id);

    return { id };
  }

  async crearAtraccion(datos) {
    this._asegurarCargado();
    const doc = await Atraccion.create({
      nombre: datos.nombre,
      zona: datos.zona,
      popularidad: datos.popularidad ?? 0,
      tiempoEsperaFila: datos.tiempoEsperaFila ?? 0,
      coordenadas: datos.coordenadas,
    });
    const atraccion = this._mapDoc(doc);

    this.avlPorNombre.insert(atraccion.nombre, atraccion);
    this.avlPorPopularidad.insert({ popularidad: atraccion.popularidad, id: atraccion.id }, atraccion);
    this.grafo.agregarNodo(atraccion);

    return atraccion;
  }

  async agregarCamino({ origen, destino, tiempoCaminata }) {
    this._asegurarCargado();
    if (!this.grafo.tieneNodo(origen) || !this.grafo.tieneNodo(destino)) {
      throw new Error('Origen o destino no existen');
    }

    const doc = await Camino.create({ origen, destino, tiempoCaminata });
    this.grafo.agregarArista(origen, destino, tiempoCaminata);

    return {
      id: doc._id.toString(),
      origen: this.grafo.obtenerNodo(origen),
      destino: this.grafo.obtenerNodo(destino),
      tiempoCaminata,
    };
  }
}

// Singleton: una sola instancia en memoria para todo el proceso del servidor.
export const parque = new Parque();
export default parque;
