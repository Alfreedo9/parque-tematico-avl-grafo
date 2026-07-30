/**
 * Grafo no dirigido y ponderado que modela el mapa del parque.
 * Representacion: lista de adyacencia (Map de Map). Implementado desde cero.
 *
 * - El peso de una arista (u, v) es el tiempo de caminata en minutos.
 * - El tiempo de espera en fila vive en el NODO (Atraccion), no en la arista.
 * - Dijkstra se implementa en O(V^2): en cada iteracion se recorre linealmente
 *   la lista de nodos no visitados para hallar el de menor distancia, sin cola
 *   de prioridad. Para el tamano del parque (decenas de nodos) esto es mas
 *   que suficiente; una mejora futura razonable seria una version
 *   O((V+E) log V) con min-heap (ver informe, seccion "Trabajo futuro").
 */

class GrafoParque {
  constructor() {
    /** id -> datos de la atraccion (incluye tiempoEsperaFila, usado como peso del nodo) */
    this.nodos = new Map();
    /** id -> Map(vecinoId -> tiempoCaminata) */
    this.adyacencia = new Map();
  }

  // ---------- construccion del grafo ----------

  agregarNodo(atraccion) {
    const { id } = atraccion;
    this.nodos.set(id, { ...atraccion });
    if (!this.adyacencia.has(id)) {
      this.adyacencia.set(id, new Map());
    }
    return this;
  }

  actualizarNodo(id, cambios) {
    const actual = this.nodos.get(id);
    if (!actual) throw new Error(`El nodo ${id} no existe en el grafo`);
    this.nodos.set(id, { ...actual, ...cambios });
    return this;
  }

  tieneNodo(id) {
    return this.nodos.has(id);
  }

  obtenerNodo(id) {
    return this.nodos.get(id);
  }

  todosLosNodos() {
    return [...this.nodos.values()];
  }

  /** Arista no dirigida: agrega la conexion en ambos sentidos. */
  agregarArista(origenId, destinoId, tiempoCaminata) {
    if (!this.tieneNodo(origenId) || !this.tieneNodo(destinoId)) {
      throw new Error('No se puede crear un camino entre nodos inexistentes');
    }
    if (tiempoCaminata < 0) {
      throw new Error('El tiempo de caminata no puede ser negativo');
    }
    this.adyacencia.get(origenId).set(destinoId, tiempoCaminata);
    this.adyacencia.get(destinoId).set(origenId, tiempoCaminata);
    return this;
  }

  vecinos(id) {
    const mapa = this.adyacencia.get(id);
    if (!mapa) return [];
    return [...mapa.entries()].map(([vecinoId, tiempoCaminata]) => ({ id: vecinoId, tiempoCaminata }));
  }

  /** Elimina una arista no dirigida (no-op si no existia). */
  eliminarArista(origenId, destinoId) {
    this.adyacencia.get(origenId)?.delete(destinoId);
    this.adyacencia.get(destinoId)?.delete(origenId);
    return this;
  }

  /** Elimina un nodo y todas las aristas que lo conectaban (no-op si no existia). */
  eliminarNodo(id) {
    const vecinos = this.adyacencia.get(id);
    if (!vecinos) return this;
    for (const vecinoId of vecinos.keys()) {
      this.adyacencia.get(vecinoId)?.delete(id);
    }
    this.adyacencia.delete(id);
    this.nodos.delete(id);
    return this;
  }

  /** Lista de aristas unicas (sin duplicar cada camino en ambos sentidos). Uso: dibujar el mapa. */
  listaAristas() {
    const vistas = new Set();
    const aristas = [];
    for (const [origenId, vecinos] of this.adyacencia.entries()) {
      for (const [destinoId, tiempoCaminata] of vecinos.entries()) {
        const clave = [origenId, destinoId].sort().join('|');
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        aristas.push({ origen: origenId, destino: destinoId, tiempoCaminata });
      }
    }
    return aristas;
  }

  // ---------- Dijkstra O(V^2) ----------

  /**
   * @param {string} origenId
   * @param {string} destinoId
   * @param {{incluirEspera?: boolean}} opciones - incluirEspera=true usa
   *   peso(u,v) = caminata(u,v) + espera(v)  -> "ruta optima"
   *   incluirEspera=false usa peso(u,v) = caminata(u,v) -> "ruta mas corta"
   * @returns {{camino: string[], distanciaTotal: number, detalle: object[]}|null}
   */
  dijkstra(origenId, destinoId, { incluirEspera = false } = {}) {
    if (!this.tieneNodo(origenId) || !this.tieneNodo(destinoId)) {
      throw new Error('Origen o destino no existen en el grafo');
    }

    const idsNodos = [...this.nodos.keys()];
    const distancias = new Map(idsNodos.map((id) => [id, Infinity]));
    const previos = new Map();
    const visitados = new Set();
    distancias.set(origenId, 0);

    for (let i = 0; i < idsNodos.length; i++) {
      // Paso lineal O(V): busca el no visitado con menor distancia
      let actual = null;
      let mejorDistancia = Infinity;
      for (const id of idsNodos) {
        if (!visitados.has(id) && distancias.get(id) < mejorDistancia) {
          mejorDistancia = distancias.get(id);
          actual = id;
        }
      }

      if (actual === null) break; // los nodos restantes son inalcanzables
      visitados.add(actual);
      if (actual === destinoId) break;

      for (const { id: vecinoId, tiempoCaminata } of this.vecinos(actual)) {
        if (visitados.has(vecinoId)) continue;

        const espera = incluirEspera ? (this.nodos.get(vecinoId)?.tiempoEsperaFila ?? 0) : 0;
        const peso = tiempoCaminata + espera;
        const nuevaDistancia = distancias.get(actual) + peso;

        if (nuevaDistancia < distancias.get(vecinoId)) {
          distancias.set(vecinoId, nuevaDistancia);
          previos.set(vecinoId, actual);
        }
      }
    }

    if (distancias.get(destinoId) === Infinity) {
      return null; // no existe ruta entre origen y destino
    }

    const camino = [];
    let cursor = destinoId;
    while (cursor !== undefined) {
      camino.unshift(cursor);
      cursor = previos.get(cursor);
    }

    return {
      camino,
      distanciaTotal: distancias.get(destinoId),
    };
  }

  rutaMasCorta(origenId, destinoId) {
    return this.dijkstra(origenId, destinoId, { incluirEspera: false });
  }

  rutaOptima(origenId, destinoId) {
    return this.dijkstra(origenId, destinoId, { incluirEspera: true });
  }

  // ---------- BFS con limite de distancia ----------

  /**
   * Explora el grafo en orden BFS (cola FIFO) partiendo de `origenId`,
   * acumulando el tiempo de caminata real de cada arista y descartando
   * ramas cuya distancia acumulada supere `limiteDistancia`. A diferencia
   * de un BFS clasico por saltos (valido solo en grafos no ponderados),
   * aqui se relaja la distancia de cada vecino al estilo SPFA: si se
   * encuentra un camino mas corto a un nodo ya encolado, se vuelve a
   * encolar. Esto mantiene el espiritu de BFS (exploracion por cola,
   * sin cola de prioridad) mientras produce distancias correctas sobre
   * aristas ponderadas.
   *
   * @returns {{id: string, nombre: string, distancia: number}[]} ordenado por distancia ascendente
   */
  atraccionesCercanas(origenId, limiteDistancia) {
    if (!this.tieneNodo(origenId)) {
      throw new Error(`El nodo ${origenId} no existe en el grafo`);
    }

    const distancias = new Map([[origenId, 0]]);
    const cola = [origenId];

    while (cola.length > 0) {
      const actualId = cola.shift();
      const distanciaActual = distancias.get(actualId);

      for (const { id: vecinoId, tiempoCaminata } of this.vecinos(actualId)) {
        const nuevaDistancia = distanciaActual + tiempoCaminata;
        if (nuevaDistancia > limiteDistancia) continue;

        if (!distancias.has(vecinoId) || nuevaDistancia < distancias.get(vecinoId)) {
          distancias.set(vecinoId, nuevaDistancia);
          cola.push(vecinoId);
        }
      }
    }

    distancias.delete(origenId);

    return [...distancias.entries()]
      .map(([id, distancia]) => ({ id, nombre: this.nodos.get(id)?.nombre, distancia }))
      .sort((a, b) => a.distancia - b.distancia);
  }

  // ---------- recorrido multi-parada (heuristica del vecino mas cercano) ----------

  /**
   * A partir de `origenId`, visita todas las `paradasId` una vez, eligiendo
   * en cada paso la parada no visitada mas cercana (por ruta optima con
   * espera) segun Dijkstra. Heuristica golosa, no garantiza el optimo global
   * (problema del vendedor viajero es NP-dificil), pero da una recorrido
   * razonable en tiempo O(k^2 * V^2) para k paradas.
   */
  planificarRecorrido(origenId, paradasId, { incluirEspera = true } = {}) {
    if (!this.tieneNodo(origenId)) {
      throw new Error(`El nodo ${origenId} no existe en el grafo`);
    }
    const pendientes = new Set(paradasId);
    for (const id of pendientes) {
      if (!this.tieneNodo(id)) throw new Error(`El nodo ${id} no existe en el grafo`);
    }

    const ordenVisita = [];
    const tramos = [];
    let actual = origenId;
    let distanciaTotal = 0;

    while (pendientes.size > 0) {
      let mejorId = null;
      let mejorTramo = null;

      for (const candidatoId of pendientes) {
        const resultado = this.dijkstra(actual, candidatoId, { incluirEspera });
        if (resultado && (!mejorTramo || resultado.distanciaTotal < mejorTramo.distanciaTotal)) {
          mejorTramo = resultado;
          mejorId = candidatoId;
        }
      }

      if (mejorId === null) break; // el resto es inalcanzable desde aqui

      ordenVisita.push(mejorId);
      tramos.push({ desde: actual, hasta: mejorId, ...mejorTramo });
      distanciaTotal += mejorTramo.distanciaTotal;
      actual = mejorId;
      pendientes.delete(mejorId);
    }

    return { ordenVisita, tramos, distanciaTotal, alcanzadas: ordenVisita.length, noAlcanzadas: [...pendientes] };
  }
}

export default GrafoParque;
export { GrafoParque };
