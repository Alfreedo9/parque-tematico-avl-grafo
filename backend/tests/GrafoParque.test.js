import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GrafoParque } from '../src/structures/GrafoParque.js';

function construirGrafoDePrueba() {
  const g = new GrafoParque();
  // A - B - C - D, mas atajo A - D directo largo, y espera alta en B
  g.agregarNodo({ id: 'A', nombre: 'A', tiempoEsperaFila: 0 });
  g.agregarNodo({ id: 'B', nombre: 'B', tiempoEsperaFila: 20 });
  g.agregarNodo({ id: 'C', nombre: 'C', tiempoEsperaFila: 0 });
  g.agregarNodo({ id: 'D', nombre: 'D', tiempoEsperaFila: 5 });
  g.agregarNodo({ id: 'E', nombre: 'E (aislado)', tiempoEsperaFila: 0 });

  g.agregarArista('A', 'B', 2);
  g.agregarArista('B', 'C', 2);
  g.agregarArista('C', 'D', 2);
  g.agregarArista('A', 'D', 10); // atajo directo, mas largo en distancia pura

  return g;
}

describe('GrafoParque', () => {
  test('agregarArista crea conexion en ambos sentidos', () => {
    const g = construirGrafoDePrueba();
    assert.ok(g.vecinos('A').some((v) => v.id === 'B'));
    assert.ok(g.vecinos('B').some((v) => v.id === 'A'));
  });

  test('rutaMasCorta ignora espera y usa solo tiempo de caminata', () => {
    const g = construirGrafoDePrueba();
    const resultado = g.rutaMasCorta('A', 'D');
    // A-B-C-D = 6 min caminata vs A-D directo = 10 min
    assert.deepEqual(resultado.camino, ['A', 'B', 'C', 'D']);
    assert.equal(resultado.distanciaTotal, 6);
  });

  test('rutaOptima suma la espera del nodo destino en cada tramo', () => {
    const g = construirGrafoDePrueba();
    const resultado = g.rutaOptima('A', 'D');
    // A-D directo: 10 (caminata) + 5 (espera en D) = 15
    // A-B-C-D: (2+20 espera B) + (2+0 espera C) + (2+5 espera D) = 22+2+7 = 31
    assert.deepEqual(resultado.camino, ['A', 'D']);
    assert.equal(resultado.distanciaTotal, 15);
  });

  test('dijkstra retorna null si no hay ruta posible', () => {
    const g = construirGrafoDePrueba();
    assert.equal(g.rutaMasCorta('A', 'E'), null);
  });

  test('dijkstra lanza error si el nodo no existe', () => {
    const g = construirGrafoDePrueba();
    assert.throws(() => g.rutaMasCorta('A', 'Z'));
  });

  test('atraccionesCercanas respeta el limite de distancia acumulada', () => {
    const g = construirGrafoDePrueba();
    const cercanas = g.atraccionesCercanas('A', 4);
    // A->B=2, A->B->C=4, A->D directo=10 (excede), A->B->C->D=6 (excede)
    const ids = cercanas.map((c) => c.id).sort();
    assert.deepEqual(ids, ['B', 'C']);
  });

  test('atraccionesCercanas con limite amplio encuentra el camino mas corto acumulado, no el primero por saltos', () => {
    const g = construirGrafoDePrueba();
    const cercanas = g.atraccionesCercanas('A', 100);
    const d = Object.fromEntries(cercanas.map((c) => [c.id, c.distancia]));
    assert.equal(d.D, 6); // debe preferir A-B-C-D (6) sobre A-D directo (10)
  });

  test('planificarRecorrido visita todas las paradas con heuristica golosa', () => {
    const g = construirGrafoDePrueba();
    const plan = g.planificarRecorrido('A', ['C', 'D'], { incluirEspera: false });
    assert.equal(plan.alcanzadas, 2);
    assert.equal(plan.noAlcanzadas.length, 0);
    assert.ok(plan.distanciaTotal > 0);
  });

  test('planificarRecorrido reporta paradas inalcanzables', () => {
    const g = construirGrafoDePrueba();
    const plan = g.planificarRecorrido('A', ['C', 'E'], { incluirEspera: false });
    assert.deepEqual(plan.noAlcanzadas, ['E']);
    assert.equal(plan.alcanzadas, 1);
  });

  test('actualizarNodo cambia la espera usada por rutaOptima', () => {
    const g = construirGrafoDePrueba();
    g.actualizarNodo('D', { tiempoEsperaFila: 0 });
    const resultado = g.rutaOptima('A', 'D');
    assert.equal(resultado.distanciaTotal, 10); // ya sin espera en D
  });

  test('eliminarNodo quita el nodo y todas sus aristas de los vecinos', () => {
    const g = construirGrafoDePrueba();
    g.eliminarNodo('B');

    assert.equal(g.tieneNodo('B'), false);
    assert.equal(g.vecinos('A').some((v) => v.id === 'B'), false);
    assert.equal(g.vecinos('C').some((v) => v.id === 'B'), false);
    assert.throws(() => g.rutaMasCorta('A', 'B'));
  });

  test('eliminarNodo sobre un nodo inexistente no lanza error (no-op)', () => {
    const g = construirGrafoDePrueba();
    assert.doesNotThrow(() => g.eliminarNodo('Z'));
  });

  test('eliminarArista quita la conexion en ambos sentidos sin borrar los nodos', () => {
    const g = construirGrafoDePrueba();
    g.eliminarArista('A', 'B');

    assert.equal(g.tieneNodo('A'), true);
    assert.equal(g.tieneNodo('B'), true);
    assert.equal(g.vecinos('A').some((v) => v.id === 'B'), false);
    assert.equal(g.vecinos('B').some((v) => v.id === 'A'), false);
  });
});
