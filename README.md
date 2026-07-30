# Sistema de Rutas y Gestión de Atracciones — Parque Temático

Proyecto de Programación II (UNSAAC). Gestiona un parque de atracciones usando
estructuras de datos propias — **Árbol AVL** y **Grafo ponderado**, implementadas
desde cero — para resolver búsqueda/ranking de atracciones y cálculo de rutas
óptimas. MongoDB solo se usa como persistencia (carga inicial + write-through);
ninguna búsqueda, ranking o ruta se resuelve con queries de Mongo.

## Arquitectura

```
[MongoDB] --(carga inicial al iniciar el server)--> [AVL + Grafo en memoria]
                                                            |
                                          [API Express: toda la lógica pasa por AVL/Grafo]
                                                            |
                                                  [Frontend React consume la API]
```

- `backend/src/structures/AVLTree.js` — AVL genérico (inserción/eliminación/búsqueda O(log n), rotaciones LL/RR/LR/RL, `topN`, `inOrder`).
- `backend/src/structures/GrafoParque.js` — grafo no dirigido y ponderado (lista de adyacencia), Dijkstra O(V²) con dos variantes de costo, BFS con límite de distancia, heurística de vecino más cercano.
- `backend/src/core/Parque.js` — orquestador: carga Mongo → AVL/Grafo en memoria, expone toda la lógica de negocio, hace write-through en cada mutación.
- `backend/src/routes` + `controllers` — API REST (Express) que solo llama a `Parque.js`.
- `frontend/` — React + Vite + Tailwind CSS, mapa SVG con coordenadas fijas, paneles de búsqueda/ranking/rutas/admin.

## Requisitos

- Node.js 20+
- Una base de datos MongoDB (recomendado: [MongoDB Atlas](https://www.mongodb.com/atlas), free tier)

## Puesta en marcha

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edita .env y coloca tu MONGODB_URI de Atlas
npm run seed   # carga las 16 atracciones y 22 caminos iniciales
npm run dev    # http://localhost:4000
```

Al iniciar, el servidor imprime la altura de ambos AVL y cuántas atracciones/caminos cargó en memoria.

Tests unitarios de las estructuras (no requieren base de datos):

```bash
npm test
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

El dev server de Vite tiene un proxy configurado (`vite.config.js`) que reenvía
`/api/*` hacia `http://localhost:4000`, así que no hace falta configurar CORS
ni variables de entorno para desarrollo local.

## Dataset inicial

16 atracciones repartidas en 4 zonas (Aventura, Familiar, Fantasía, Acuática),
con tiempos de caminata y espera inventados pero realistas. Ver
`backend/scripts/seed.js`.

## Endpoints principales

Ver `backend/src/routes/*.routes.js`. Resumen:

- `GET /api/atracciones/buscar?nombre=` — búsqueda por AVL(nombre)
- `GET /api/atracciones/ranking?top=` — `topN` de AVL(popularidad)
- `GET /api/atracciones` — listado alfabético (in-order del AVL)
- `GET /api/caminos` — aristas del grafo (para dibujar el mapa)
- `GET /api/rutas/corta?origen=&destino=` — Dijkstra sin espera
- `GET /api/rutas/optima?origen=&destino=` — Dijkstra con espera del destino
- `GET /api/atracciones/cercanas?id=&limite=` — BFS/SPFA con límite de distancia
- `POST /api/rutas/planificar` — recorrido multi-parada (vecino más cercano)
- `POST /api/atracciones/visita` — incrementa popularidad (remove+reinsert en AVL)
- `POST /api/atracciones`, `PUT /api/atracciones/:id/espera`, `POST /api/caminos` — administración

## Informe

El informe en LaTeX (formato IEEE) está en `informe/`.
