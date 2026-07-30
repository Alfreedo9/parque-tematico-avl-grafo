/**
 * Arbol AVL generico, implementado desde cero (sin librerias externas).
 * Cada nodo guarda { key, value }. El orden lo define `comparator(keyA, keyB)`,
 * que debe devolver <0, 0 o >0 igual que Array.prototype.sort.
 *
 * Para evitar colisiones cuando el campo de indexacion tiene valores repetidos
 * (p. ej. popularidad), el comparator usado por Parque.js incluye un desempate
 * por id, de modo que cada clave es unica dentro del arbol.
 */

class AVLNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

function defaultComparator(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class AVLTree {
  constructor(comparator = defaultComparator) {
    this.root = null;
    this.comparator = comparator;
    this.size = 0;
  }

  // ---------- utilidades internas ----------

  _height(node) {
    return node ? node.height : 0;
  }

  _updateHeight(node) {
    node.height = 1 + Math.max(this._height(node.left), this._height(node.right));
  }

  _balanceFactor(node) {
    return node ? this._height(node.left) - this._height(node.right) : 0;
  }

  _rotateRight(y) {
    const x = y.left;
    const t2 = x.right;

    x.right = y;
    y.left = t2;

    this._updateHeight(y);
    this._updateHeight(x);

    return x;
  }

  _rotateLeft(x) {
    const y = x.right;
    const t2 = y.left;

    y.left = x;
    x.right = t2;

    this._updateHeight(x);
    this._updateHeight(y);

    return y;
  }

  _rebalance(node) {
    this._updateHeight(node);
    const balance = this._balanceFactor(node);

    // Caso Izquierda-Izquierda
    if (balance > 1 && this._balanceFactor(node.left) >= 0) {
      return this._rotateRight(node);
    }
    // Caso Izquierda-Derecha
    if (balance > 1 && this._balanceFactor(node.left) < 0) {
      node.left = this._rotateLeft(node.left);
      return this._rotateRight(node);
    }
    // Caso Derecha-Derecha
    if (balance < -1 && this._balanceFactor(node.right) <= 0) {
      return this._rotateLeft(node);
    }
    // Caso Derecha-Izquierda
    if (balance < -1 && this._balanceFactor(node.right) > 0) {
      node.right = this._rotateRight(node.right);
      return this._rotateLeft(node);
    }

    return node;
  }

  // ---------- insercion ----------

  insert(key, value) {
    this.root = this._insert(this.root, key, value);
    return this;
  }

  _insert(node, key, value) {
    if (!node) {
      this.size += 1;
      return new AVLNode(key, value);
    }

    const cmp = this.comparator(key, node.key);
    if (cmp < 0) {
      node.left = this._insert(node.left, key, value);
    } else if (cmp > 0) {
      node.right = this._insert(node.right, key, value);
    } else {
      // clave ya existe: actualiza el valor, no crece el arbol
      node.value = value;
      return node;
    }

    return this._rebalance(node);
  }

  // ---------- eliminacion ----------

  delete(key) {
    this.root = this._delete(this.root, key);
    return this;
  }

  _delete(node, key) {
    if (!node) return null;

    const cmp = this.comparator(key, node.key);
    if (cmp < 0) {
      node.left = this._delete(node.left, key);
    } else if (cmp > 0) {
      node.right = this._delete(node.right, key);
    } else {
      // nodo encontrado
      if (!node.left || !node.right) {
        const child = node.left || node.right;
        this.size -= 1;
        return child;
      }
      // dos hijos: reemplazar con el sucesor in-order (minimo del subarbol derecho)
      const sucesor = this._minNode(node.right);
      node.key = sucesor.key;
      node.value = sucesor.value;
      node.right = this._deleteMin(node.right);
    }

    return this._rebalance(node);
  }

  _deleteMin(node) {
    if (!node.left) {
      this.size -= 1;
      return node.right;
    }
    node.left = this._deleteMin(node.left);
    return this._rebalance(node);
  }

  _minNode(node) {
    let current = node;
    while (current.left) current = current.left;
    return current;
  }

  // ---------- busqueda ----------

  search(key) {
    let node = this.root;
    while (node) {
      const cmp = this.comparator(key, node.key);
      if (cmp === 0) return node.value;
      node = cmp < 0 ? node.left : node.right;
    }
    return undefined;
  }

  contains(key) {
    return this.search(key) !== undefined;
  }

  // ---------- recorridos ----------

  /** Recorrido in-order ascendente segun el comparator: O(n). */
  inOrder() {
    const resultado = [];
    const recorrer = (node) => {
      if (!node) return;
      recorrer(node.left);
      resultado.push({ key: node.key, value: node.value });
      recorrer(node.right);
    };
    recorrer(this.root);
    return resultado;
  }

  /**
   * Los n elementos "mayores" segun el comparator (recorrido in-order
   * invertido: derecha, nodo, izquierda), con corte temprano. O(n) en el peor
   * caso, O(log n + n) tipico.
   */
  topN(n) {
    const resultado = [];
    const recorrer = (node) => {
      if (!node || resultado.length >= n) return;
      recorrer(node.right);
      if (resultado.length >= n) return;
      resultado.push({ key: node.key, value: node.value });
      recorrer(node.left);
    };
    recorrer(this.root);
    return resultado;
  }

  getHeight() {
    return this._height(this.root);
  }

  isEmpty() {
    return this.root === null;
  }
}

export default AVLTree;
