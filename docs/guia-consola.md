# Guía: ver y modificar atracciones desde la consola

Cómo listar, buscar, crear, editar y eliminar atracciones sin usar el frontend,
hablándole directamente a la API con `curl` (terminal), `fetch` (consola del
navegador) o `Invoke-RestMethod` (PowerShell).

Todo lo que hace el frontend pasa por estos mismos endpoints, así que cualquier
cambio hecho desde la consola se ve en el mapa apenas recargas la página.

## Regla de oro

**Modifica siempre a través de la API, nunca escribiendo directo en MongoDB.**

El servidor carga las atracciones y los caminos en el AVL y en el grafo **una
sola vez, al arrancar** (`Parque.cargar()` en `backend/src/core/Parque.js`). A
partir de ahí cada endpoint de escritura hace *write-through*: actualiza Mongo
**y** las estructuras en memoria. Si insertas un documento a mano con `mongosh`
o Atlas, Mongo queda actualizado pero el AVL y el grafo del proceso en ejecución
no se enteran: la atracción no aparecerá en búsquedas, ranking ni rutas hasta
que reinicies el servidor.

## 0. Preparación

Levanta el backend (necesita `MONGODB_URI` en `backend/.env`):

```bash
cd backend
npm install
npm run seed   # solo la primera vez: carga 16 atracciones y 22 caminos
npm run dev    # queda escuchando en http://localhost:4000
```

En otra terminal, define la URL base y comprueba que responde:

```bash
export API=http://localhost:4000/api      # local
# export API=https://parque-backend-c4re.onrender.com/api   # producción (Render)

curl -s $API/salud
# {"estado":"ok","cargado":true}
```

Los ejemplos usan [`jq`](https://jqlang.github.io/jq/) solo para que la salida se
lea bonito (`sudo apt install jq`). Si no lo tienes, borra el ` | jq` del final.

> En producción el backend de Render se duerme tras ~15 min sin tráfico: la
> primera petición puede tardar 30-50 s. No es un error, es el free tier.

## 1. Visualizar

### Listar todas las atracciones (recorrido in-order del AVL por nombre)

```bash
curl -s $API/atracciones | jq
```

Vista compacta `id — nombre (zona)`, que es la que más vas a usar:

```bash
curl -s $API/atracciones | jq -r '.[] | "\(.id)  \(.nombre)  [\(.zona)]  espera=\(.tiempoEsperaFila)min  pop=\(.popularidad)"'
```

```
68f0...a13  Barco Pirata del Titicaca  [Fantasía]  espera=18min  pop=72
68f0...a19  Bosque Encantado de Paucartambo  [Fantasía]  espera=6min  pop=30
68f0...a0e  Carrusel Encantado  [Familiar]  espera=8min  pop=70
...
```

### Buscar por nombre (búsqueda en el AVL, exacta o por substring)

```bash
curl -s --get $API/atracciones/buscar --data-urlencode "nombre=Río" | jq
```

`--data-urlencode` es importante: codifica tildes y espacios. Si el nombre es
exacto devuelve un único resultado (búsqueda O(log n)); si no, filtra por
substring sobre el in-order.

### Ranking por popularidad (`topN` del segundo AVL)

```bash
curl -s "$API/atracciones/ranking?top=5" | jq -r '.[] | "\(.popularidad)\t\(.nombre)"'
```

### Ver los caminos del grafo (aristas)

```bash
curl -s $API/caminos | jq -r '.[] | "\(.origen.nombre) <-> \(.destino.nombre)  \(.tiempoCaminata)min"'
```

### Ver rutas y vecindad (Dijkstra / BFS)

```bash
# guarda dos ids en variables (ver sección 2)
curl -s "$API/rutas/corta?origen=$ORIGEN&destino=$DESTINO"  | jq '{distanciaTotal, pasos: [.pasos[].nombre]}'
curl -s "$API/rutas/optima?origen=$ORIGEN&destino=$DESTINO" | jq '{distanciaTotal, pasos: [.pasos[].nombre]}'

# atracciones a 10 minutos o menos de una dada
curl -s "$API/atracciones/cercanas?id=$ORIGEN&limite=10" | jq -r '.[] | "\(.distancia)min\t\(.nombre)"'
```

`corta` usa solo tiempo de caminata; `optima` suma además el tiempo de espera en
fila del destino.

## 2. Obtener el ID de una atracción

Editar y eliminar requieren el `id` de Mongo (24 caracteres hex). Lo más cómodo
es guardarlo en una variable de shell:

```bash
ID=$(curl -s --get $API/atracciones/buscar --data-urlencode "nombre=Río Loco" | jq -r '.[0].id')
echo $ID
# 68f0c1e2b4d9f3a7c2e10a1c
```

Si la búsqueda devuelve varias, revisa primero con `... | jq -r '.[] | "\(.id) \(.nombre)"'` y copia el que quieras.

## 3. Agregar una atracción

`POST /api/atracciones`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `nombre` | string | sí | **único** en toda la base |
| `zona` | string | sí | libre; el mapa colorea `Aventura`, `Familiar`, `Fantasía`, `Acuática` — cualquier otra sale con el color por defecto |
| `coordenadas` | `{x, y}` números | sí | el mapa SVG mide 860 × 640, así que usa `x` entre 0 y 860, `y` entre 0 y 640 |
| `popularidad` | número ≥ 0 | no (por defecto 0) | |
| `tiempoEsperaFila` | número ≥ 0 | no (por defecto 0) | minutos |

```bash
curl -s -X POST $API/atracciones \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre": "Montaña Rusa Andina",
    "zona": "Aventura",
    "popularidad": 0,
    "tiempoEsperaFila": 18,
    "coordenadas": { "x": 330, "y": 180 }
  }' | jq
```

Respuesta `201`:

```json
{
  "id": "68f0c1e2b4d9f3a7c2e10a20",
  "nombre": "Montaña Rusa Andina",
  "zona": "Aventura",
  "popularidad": 0,
  "tiempoEsperaFila": 18,
  "coordenadas": { "x": 330, "y": 180 }
}
```

Detrás de escena esto inserta en Mongo, inserta en el AVL(nombre), en el
AVL(popularidad) y agrega el nodo al grafo.

### Conéctala al grafo (si no, queda aislada)

Una atracción recién creada es un nodo **sin aristas**: aparece en el listado,
en la búsqueda y en el ranking, pero ninguna ruta llega a ella y el mapa la
dibuja suelta. Agrégale al menos un camino:

```bash
NUEVA=$(curl -s --get $API/atracciones/buscar --data-urlencode "nombre=Montaña Rusa Andina" | jq -r '.[0].id')
TORRE=$(curl -s --get $API/atracciones/buscar --data-urlencode "nombre=Torre del Vértigo" | jq -r '.[0].id')

curl -s -X POST $API/caminos \
  -H 'Content-Type: application/json' \
  -d "{\"origen\":\"$NUEVA\",\"destino\":\"$TORRE\",\"tiempoCaminata\":4}" | jq
```

El camino es **no dirigido**: queda registrado en ambos sentidos. Repite el
`POST` con otros vecinos para darle más conexiones.

Comprueba que ya es alcanzable:

```bash
curl -s "$API/rutas/corta?origen=$TORRE&destino=$NUEVA" | jq '{distanciaTotal, pasos: [.pasos[].nombre]}'
```

## 4. Modificar una atracción

`PUT /api/atracciones/:id` — envía **solo** los campos que quieras cambiar; los
que omitas se quedan como están.

Campos editables: `nombre`, `zona`, `tiempoEsperaFila`, `coordenadas`.

```bash
# subir el tiempo de espera
curl -s -X PUT $API/atracciones/$ID \
  -H 'Content-Type: application/json' \
  -d '{"tiempoEsperaFila": 35}' | jq

# moverla en el mapa y cambiarle la zona
curl -s -X PUT $API/atracciones/$ID \
  -H 'Content-Type: application/json' \
  -d '{"zona": "Familiar", "coordenadas": {"x": 500, "y": 300}}' | jq

# renombrarla
curl -s -X PUT $API/atracciones/$ID \
  -H 'Content-Type: application/json' \
  -d '{"nombre": "Montaña Rusa Andina II"}' | jq
```

`popularidad` **no** se edita por aquí a propósito: es la clave del
AVL(popularidad) y se mueve solo registrando visitas.

```bash
curl -s -X POST $API/atracciones/visita \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$ID\"}" | jq '{nombre, popularidad}'
```

Cada visita suma 1 y reordena el AVL de popularidad (borrado + reinserción con
la clave nueva, nunca mutación in-place de la clave). Verifícalo con el ranking:

```bash
curl -s "$API/atracciones/ranking?top=5" | jq -r '.[] | "\(.popularidad)\t\(.nombre)"'
```

## 5. Quitar una atracción

`DELETE /api/atracciones/:id` — **elimina en cascada todos sus caminos.**

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE $API/atracciones/$ID
# 204
```

`204 No Content` significa borrado correcto (no devuelve cuerpo). Un `404` quiere
decir que ese id no existe.

Comprueba que desapareció de las tres estructuras:

```bash
curl -s --get $API/atracciones/buscar --data-urlencode "nombre=Montaña Rusa Andina II"   # []
curl -s $API/caminos | jq '[.[] | select(.origen.nombre|test("Montaña")) ] | length'      # 0
```

> **No hay endpoint para borrar un camino suelto.** Las aristas se eliminan solo
> al borrar una de sus atracciones, o rehaciendo el dataset con `npm run seed`.

## 6. Todo el flujo de una vez

Copiar y pegar; crea, conecta, consulta, edita y borra:

```bash
export API=http://localhost:4000/api

# crear
NUEVA=$(curl -s -X POST $API/atracciones -H 'Content-Type: application/json' \
  -d '{"nombre":"Prueba Consola","zona":"Aventura","tiempoEsperaFila":10,"coordenadas":{"x":400,"y":200}}' \
  | jq -r '.id')

# conectar con una existente
VECINA=$(curl -s --get $API/atracciones/buscar --data-urlencode "nombre=Torre del Vértigo" | jq -r '.[0].id')
curl -s -X POST $API/caminos -H 'Content-Type: application/json' \
  -d "{\"origen\":\"$NUEVA\",\"destino\":\"$VECINA\",\"tiempoCaminata\":5}" > /dev/null

# ver
curl -s "$API/rutas/corta?origen=$VECINA&destino=$NUEVA" | jq '{distanciaTotal, pasos:[.pasos[].nombre]}'

# editar
curl -s -X PUT $API/atracciones/$NUEVA -H 'Content-Type: application/json' \
  -d '{"tiempoEsperaFila":22}' | jq '{nombre, tiempoEsperaFila}'

# quitar (borra también el camino creado arriba)
curl -s -o /dev/null -w 'DELETE -> %{http_code}\n' -X DELETE $API/atracciones/$NUEVA
```

## 7. Desde la consola del navegador (F12)

Con el frontend abierto (`http://localhost:5173` o la URL de Vercel), la consola
de DevTools ya está en el mismo origen, así que basta `fetch` con rutas
relativas. Recarga la página después de escribir para ver los cambios en el mapa.

```js
const API = '/api';   // en dev el proxy de Vite reenvía a localhost:4000

// listar
await (await fetch(`${API}/atracciones`)).json();

// crear
await (await fetch(`${API}/atracciones`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Montaña Rusa Andina',
    zona: 'Aventura',
    tiempoEsperaFila: 18,
    coordenadas: { x: 330, y: 180 },
  }),
})).json();

// buscar y quedarse con el id
const { id } = (await (await fetch(`${API}/atracciones/buscar?nombre=${encodeURIComponent('Montaña Rusa Andina')}`)).json())[0];

// editar
await (await fetch(`${API}/atracciones/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tiempoEsperaFila: 30 }),
})).json();

// eliminar
(await fetch(`${API}/atracciones/${id}`, { method: 'DELETE' })).status;   // 204
```

Si abres la consola en una pestaña que **no** es la del frontend, cambia `API`
por la URL completa del backend (`http://localhost:4000/api`); CORS está abierto.

## 8. Desde PowerShell (Windows)

```powershell
$API = "http://localhost:4000/api"

# listar
Invoke-RestMethod "$API/atracciones" | Select-Object nombre, zona, tiempoEsperaFila

# crear
$cuerpo = @{
  nombre           = "Montaña Rusa Andina"
  zona             = "Aventura"
  tiempoEsperaFila = 18
  coordenadas      = @{ x = 330; y = 180 }
} | ConvertTo-Json
$nueva = Invoke-RestMethod "$API/atracciones" -Method Post -ContentType "application/json; charset=utf-8" -Body $cuerpo

# editar
Invoke-RestMethod "$API/atracciones/$($nueva.id)" -Method Put -ContentType "application/json" -Body '{"tiempoEsperaFila":30}'

# eliminar
Invoke-RestMethod "$API/atracciones/$($nueva.id)" -Method Delete
```

Ojo con el `charset=utf-8` al enviar nombres con tildes.

## 9. Errores comunes

| Código y mensaje | Qué pasó | Solución |
|---|---|---|
| `400 nombre, zona y coordenadas {x,y} son requeridos` | falta un campo, o `x`/`y` llegaron como texto | manda `"x": 330`, no `"x": "330"` |
| `400 E11000 duplicate key ... nombre` | ya existe una atracción con ese nombre | usa otro nombre o edita la existente |
| `409 Ya existe una atraccion con ese nombre` | lo mismo, pero al renombrar con `PUT` | |
| `400 tiempoEsperaFila debe ser un numero >= 0` | mandaste string o negativo | usa un número, p. ej. `15` |
| `404 Atraccion no encontrada` | el `id` no existe (o ya lo borraste) | vuelve a obtener el id con `/buscar` |
| `400 Origen o destino no existen` (en `POST /caminos`) | uno de los ids no está en el grafo | verifica los dos ids |
| `404 Recurso no encontrado` | URL mal escrita | recuerda el prefijo `/api` |
| respuesta vacía / *connection refused* | el backend no está corriendo | `npm run dev` en `backend/` |
| creaste algo y no aparece en búsquedas | lo insertaste a mano en Mongo | ver "Regla de oro"; reinicia el servidor |

Para ver el mensaje exacto que devuelve el servidor junto al código HTTP:

```bash
curl -s -w '\nHTTP %{http_code}\n' -X POST $API/atracciones \
  -H 'Content-Type: application/json' -d '{"nombre":"Sin zona"}'
```

## 10. Volver al estado inicial

`npm run seed` **borra ambas colecciones** y reinserta las 16 atracciones y 22
caminos originales:

```bash
cd backend
npm run seed
# reinicia el servidor para que el AVL y el grafo se reconstruyan desde cero
```

Si quieres que el dataset base incluya tu atracción de forma permanente,
agrégala al arreglo `atracciones` de `backend/scripts/seed.js` (y sus conexiones
a `caminosPorNombre`) en lugar de crearla por API.

## Referencia rápida de endpoints

| Método y ruta | Para qué | Estructura que usa |
|---|---|---|
| `GET /api/atracciones` | listado alfabético | AVL(nombre), in-order |
| `GET /api/atracciones/buscar?nombre=` | buscar | AVL(nombre), O(log n) |
| `GET /api/atracciones/ranking?top=` | más populares | AVL(popularidad), `topN` |
| `GET /api/atracciones/cercanas?id=&limite=` | vecindad por tiempo | Grafo, BFS con límite |
| `GET /api/caminos` | aristas del mapa | Grafo |
| `GET /api/rutas/corta?origen=&destino=` | ruta mínima en caminata | Grafo, Dijkstra |
| `GET /api/rutas/optima?origen=&destino=` | caminata + espera | Grafo, Dijkstra |
| `POST /api/rutas/planificar` | recorrido multi-parada | Grafo, vecino más cercano |
| `POST /api/atracciones` | crear | AVL ×2 + Grafo + Mongo |
| `PUT /api/atracciones/:id` | editar | AVL ×2 + Grafo + Mongo |
| `DELETE /api/atracciones/:id` | eliminar (cascada de caminos) | AVL ×2 + Grafo + Mongo |
| `POST /api/atracciones/visita` | +1 popularidad | AVL(popularidad) reinserción |
| `POST /api/caminos` | agregar arista | Grafo + Mongo |
| `GET /api/salud` | estado del servidor | — |
