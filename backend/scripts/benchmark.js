/**
 * Script de benchmarking para el informe. No requiere MongoDB: opera
 * directamente sobre las estructuras en memoria (AVLTree, GrafoParque).
 *
 * Uso: node scripts/benchmark.js
 */
import { AVLTree } from '../src/structures/AVLTree.js';
import { GrafoParque } from '../src/structures/GrafoParque.js';

function alturaTeoricaMax(n) {
  // Cota superior de altura de un AVL con n nodos: 1.44 * log2(n+2) - 0.328
  return 1.4404 * Math.log2(n + 2) - 0.3277;
}

function benchmarkAVL(tamanos) {
  console.log('\n=== AVLTree: altura observada vs. cota teorica O(log n) ===');
  console.log('n\t\taltura\tcota_teorica\tlog2(n)');
  for (const n of tamanos) {
    const arbol = new AVLTree();
    // Insercion en orden aleatorio (peor caso realista)
    const claves = Array.from({ length: n }, (_, i) => i);
    for (let i = claves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [claves[i], claves[j]] = [claves[j], claves[i]];
    }
    for (const k of claves) arbol.insert(k, k);
    const altura = arbol.getHeight();
    console.log(`${n}\t\t${altura}\t${alturaTeoricaMax(n).toFixed(2)}\t\t${Math.log2(n).toFixed(2)}`);
  }
}

function construirGrafoAleatorio(v, gradoPromedio) {
  const g = new GrafoParque();
  for (let i = 0; i < v; i++) {
    g.agregarNodo({ id: `n${i}`, nombre: `Nodo ${i}`, zona: 'Z', popularidad: 0, tiempoEsperaFila: Math.floor(Math.random() * 20) });
  }
  const aristasObjetivo = Math.floor((v * gradoPromedio) / 2);
  let creadas = 0;
  let intentos = 0;
  while (creadas < aristasObjetivo && intentos < aristasObjetivo * 20) {
    intentos++;
    const a = Math.floor(Math.random() * v);
    const b = Math.floor(Math.random() * v);
    if (a === b) continue;
    if (g.adyacencia.get(`n${a}`).has(`n${b}`)) continue;
    g.agregarArista(`n${a}`, `n${b}`, 1 + Math.floor(Math.random() * 8));
    creadas++;
  }
  return g;
}

function benchmarkDijkstra(tamanos, repeticiones = 30) {
  console.log('\n=== Dijkstra O(V^2): tiempo promedio por consulta ===');
  console.log('V\t\tE(aprox)\ttiempo_promedio_ms');
  for (const v of tamanos) {
    const g = construirGrafoAleatorio(v, 4);
    const ids = [...g.nodos.keys()];
    let total = 0;
    for (let i = 0; i < repeticiones; i++) {
      const origen = ids[Math.floor(Math.random() * ids.length)];
      const destino = ids[Math.floor(Math.random() * ids.length)];
      const inicio = performance.now();
      g.dijkstra(origen, destino, { incluirEspera: true });
      total += performance.now() - inicio;
    }
    console.log(`${v}\t\t~${v * 2}\t\t${(total / repeticiones).toFixed(4)} ms`);
  }
}

function benchmarkParqueSemilla() {
  console.log('\n=== Grafo del dataset semilla (16 atracciones, 22 caminos) ===');
  const g = new GrafoParque();
  const nombres = [
    'Cóndor Salvaje', 'Torre del Vértigo', 'Rápidos del Apurímac', 'Sendero del Puma',
    'Carrusel Encantado', 'Tren del Valle Sagrado', 'Laberinto de Machu', 'Rueda Panorámica Inca',
    "Castillo de Q'enqo", 'Casa del Espejo Andino', 'Barco Pirata del Titicaca', 'Bosque Encantado de Paucartambo',
    'Río Loco', 'Piscina de Olas del Colca', 'Toboganes del Manu', 'Lago de las Sirenas',
  ];
  nombres.forEach((n, i) => g.agregarNodo({ id: `n${i}`, nombre: n, zona: 'Z', popularidad: 0, tiempoEsperaFila: 10 }));

  const aristas = [
    [0, 1, 3], [0, 2, 2], [2, 3, 2], [1, 2, 4],
    [4, 5, 3], [4, 6, 3], [6, 7, 3], [5, 7, 4],
    [8, 9, 3], [8, 11, 2], [9, 10, 3], [10, 11, 3],
    [12, 13, 3], [12, 15, 2], [13, 14, 3], [14, 15, 2],
    [1, 4, 7], [7, 13, 6], [9, 12, 8], [3, 8, 5], [2, 9, 6], [6, 12, 5],
  ];
  aristas.forEach(([a, b, w]) => g.agregarArista(`n${a}`, `n${b}`, w));

  const ids = [...g.nodos.keys()];
  let total = 0;
  let pares = 0;
  const inicioTotal = performance.now();
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i === j) continue;
      const inicio = performance.now();
      g.rutaOptima(ids[i], ids[j]);
      total += performance.now() - inicio;
      pares++;
    }
  }
  console.log(`Pares origen-destino evaluados: ${pares}`);
  console.log(`Tiempo total: ${(performance.now() - inicioTotal).toFixed(2)} ms`);
  console.log(`Tiempo promedio por consulta: ${(total / pares).toFixed(4)} ms`);
}

benchmarkAVL([16, 100, 1000, 10000, 100000]);
benchmarkParqueSemilla();
benchmarkDijkstra([16, 50, 100, 300, 500]);
