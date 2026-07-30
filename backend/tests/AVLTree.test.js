import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AVLTree } from '../src/structures/AVLTree.js';

function esBalanceado(node) {
  if (!node) return { balanceado: true, altura: 0 };
  const izq = esBalanceado(node.left);
  const der = esBalanceado(node.right);
  const altura = 1 + Math.max(izq.altura, der.altura);
  const balanceado = izq.balanceado && der.balanceado && Math.abs(izq.altura - der.altura) <= 1;
  return { balanceado, altura };
}

function esBST(node, comparator, min = null, max = null) {
  if (!node) return true;
  if (min !== null && comparator(node.key, min) <= 0) return false;
  if (max !== null && comparator(node.key, max) >= 0) return false;
  return esBST(node.left, comparator, min, node.key) && esBST(node.right, comparator, node.key, max);
}

describe('AVLTree', () => {
  test('insercion mantiene orden BST y balance tras insertar en secuencia ascendente (peor caso para BST simple)', () => {
    const arbol = new AVLTree();
    for (let i = 1; i <= 1000; i++) arbol.insert(i, `valor-${i}`);

    assert.equal(arbol.size, 1000);
    assert.ok(esBalanceado(arbol.root).balanceado, 'el arbol debe estar balanceado');
    assert.ok(esBST(arbol.root, arbol.comparator), 'debe respetar la propiedad BST');

    // altura O(log n): para 1000 nodos, un AVL nunca supera ~1.44*log2(n+2)
    const alturaMaxima = Math.ceil(1.45 * Math.log2(1002));
    assert.ok(arbol.getHeight() <= alturaMaxima, `altura ${arbol.getHeight()} supera la cota ${alturaMaxima}`);
  });

  test('busqueda encuentra valores insertados y no encuentra claves ausentes', () => {
    const arbol = new AVLTree();
    arbol.insert(5, 'cinco').insert(2, 'dos').insert(8, 'ocho');

    assert.equal(arbol.search(5), 'cinco');
    assert.equal(arbol.search(8), 'ocho');
    assert.equal(arbol.search(99), undefined);
  });

  test('insertar una clave existente actualiza el valor sin duplicar el nodo', () => {
    const arbol = new AVLTree();
    arbol.insert(1, 'a').insert(1, 'b');
    assert.equal(arbol.size, 1);
    assert.equal(arbol.search(1), 'b');
  });

  test('eliminacion de hoja, nodo con un hijo y nodo con dos hijos mantiene balance y BST', () => {
    const arbol = new AVLTree();
    [50, 30, 70, 20, 40, 60, 80, 10].forEach((k) => arbol.insert(k, `v${k}`));

    arbol.delete(10); // hoja
    arbol.delete(70); // nodo con dos hijos
    arbol.delete(30); // nodo con un hijo tras el borrado anterior

    assert.equal(arbol.search(10), undefined);
    assert.equal(arbol.search(70), undefined);
    assert.equal(arbol.search(30), undefined);
    assert.equal(arbol.size, 5);
    assert.ok(esBalanceado(arbol.root).balanceado);
    assert.ok(esBST(arbol.root, arbol.comparator));
  });

  test('eliminar todos los nodos deja el arbol vacio', () => {
    const arbol = new AVLTree();
    const claves = [15, 10, 20, 8, 12, 17, 25];
    claves.forEach((k) => arbol.insert(k, k));
    claves.forEach((k) => arbol.delete(k));

    assert.ok(arbol.isEmpty());
    assert.equal(arbol.size, 0);
  });

  test('inOrder devuelve las claves en orden ascendente', () => {
    const arbol = new AVLTree();
    [9, 1, 5, 3, 7, 2, 8].forEach((k) => arbol.insert(k, k));

    const claves = arbol.inOrder().map((n) => n.key);
    assert.deepEqual(claves, [1, 2, 3, 5, 7, 8, 9]);
  });

  test('topN devuelve los n mayores en orden descendente', () => {
    const arbol = new AVLTree();
    [9, 1, 5, 3, 7, 2, 8, 4, 6].forEach((k) => arbol.insert(k, k));

    assert.deepEqual(arbol.topN(3).map((n) => n.key), [9, 8, 7]);
    assert.deepEqual(arbol.topN(0), []);
    assert.deepEqual(arbol.topN(20).length, 9);
  });

  test('comparator con desempate permite claves compuestas (simula popularidad + id)', () => {
    const comparator = (a, b) => (a.popularidad - b.popularidad) || a.id.localeCompare(b.id);
    const arbol = new AVLTree(comparator);

    arbol.insert({ popularidad: 50, id: 'a' }, 'Atraccion A');
    arbol.insert({ popularidad: 50, id: 'b' }, 'Atraccion B'); // misma popularidad, distinto id
    arbol.insert({ popularidad: 90, id: 'c' }, 'Atraccion C');

    assert.equal(arbol.size, 3);
    const top1 = arbol.topN(1);
    assert.equal(top1[0].value, 'Atraccion C');
  });

  test('rotaciones LL, RR, LR, RL producen un arbol balanceado', () => {
    // LL
    let arbol = new AVLTree();
    [30, 20, 10].forEach((k) => arbol.insert(k, k));
    assert.equal(arbol.root.key, 20);

    // RR
    arbol = new AVLTree();
    [10, 20, 30].forEach((k) => arbol.insert(k, k));
    assert.equal(arbol.root.key, 20);

    // LR
    arbol = new AVLTree();
    [30, 10, 20].forEach((k) => arbol.insert(k, k));
    assert.equal(arbol.root.key, 20);

    // RL
    arbol = new AVLTree();
    [10, 30, 20].forEach((k) => arbol.insert(k, k));
    assert.equal(arbol.root.key, 20);
  });
});
