import 'dotenv/config';
import { conectarDB } from '../src/config/db.js';
import Atraccion from '../src/models/Atraccion.js';
import Camino from '../src/models/Camino.js';
import mongoose from 'mongoose';

const atracciones = [
  // Zona Aventura
  { nombre: "Cóndor Salvaje", zona: "Aventura", popularidad: 82, tiempoEsperaFila: 25, coordenadas: { x: 150, y: 120 } },
  { nombre: "Torre del Vértigo", zona: "Aventura", popularidad: 65, tiempoEsperaFila: 15, coordenadas: { x: 280, y: 100 } },
  { nombre: "Rápidos del Apurímac", zona: "Aventura", popularidad: 58, tiempoEsperaFila: 20, coordenadas: { x: 200, y: 230 } },
  { nombre: "Sendero del Puma", zona: "Aventura", popularidad: 40, tiempoEsperaFila: 10, coordenadas: { x: 100, y: 250 } },

  // Zona Familiar
  { nombre: "Carrusel Encantado", zona: "Familiar", popularidad: 70, tiempoEsperaFila: 8, coordenadas: { x: 550, y: 100 } },
  { nombre: "Tren del Valle Sagrado", zona: "Familiar", popularidad: 55, tiempoEsperaFila: 12, coordenadas: { x: 680, y: 130 } },
  { nombre: "Laberinto de Machu", zona: "Familiar", popularidad: 48, tiempoEsperaFila: 10, coordenadas: { x: 600, y: 230 } },
  { nombre: "Rueda Panorámica Inca", zona: "Familiar", popularidad: 90, tiempoEsperaFila: 30, coordenadas: { x: 750, y: 220 } },

  // Zona Fantasía
  { nombre: "Castillo de Q'enqo", zona: "Fantasía", popularidad: 60, tiempoEsperaFila: 15, coordenadas: { x: 150, y: 420 } },
  { nombre: "Casa del Espejo Andino", zona: "Fantasía", popularidad: 35, tiempoEsperaFila: 5, coordenadas: { x: 280, y: 450 } },
  { nombre: "Barco Pirata del Titicaca", zona: "Fantasía", popularidad: 72, tiempoEsperaFila: 18, coordenadas: { x: 200, y: 550 } },
  { nombre: "Bosque Encantado de Paucartambo", zona: "Fantasía", popularidad: 30, tiempoEsperaFila: 6, coordenadas: { x: 100, y: 500 } },

  // Zona Acuática
  { nombre: "Río Loco", zona: "Acuática", popularidad: 68, tiempoEsperaFila: 20, coordenadas: { x: 600, y: 420 } },
  { nombre: "Piscina de Olas del Colca", zona: "Acuática", popularidad: 77, tiempoEsperaFila: 22, coordenadas: { x: 750, y: 450 } },
  { nombre: "Toboganes del Manu", zona: "Acuática", popularidad: 85, tiempoEsperaFila: 28, coordenadas: { x: 680, y: 550 } },
  { nombre: "Lago de las Sirenas", zona: "Acuática", popularidad: 42, tiempoEsperaFila: 9, coordenadas: { x: 600, y: 550 } },
];

// Caminos referenciados por nombre; se resuelven a ObjectId luego de insertar.
const caminosPorNombre = [
  // Aventura
  ["Cóndor Salvaje", "Torre del Vértigo", 3],
  ["Cóndor Salvaje", "Rápidos del Apurímac", 2],
  ["Rápidos del Apurímac", "Sendero del Puma", 2],
  ["Torre del Vértigo", "Rápidos del Apurímac", 4],

  // Familiar
  ["Carrusel Encantado", "Tren del Valle Sagrado", 3],
  ["Carrusel Encantado", "Laberinto de Machu", 3],
  ["Laberinto de Machu", "Rueda Panorámica Inca", 3],
  ["Tren del Valle Sagrado", "Rueda Panorámica Inca", 4],

  // Fantasía
  ["Castillo de Q'enqo", "Casa del Espejo Andino", 3],
  ["Castillo de Q'enqo", "Bosque Encantado de Paucartambo", 2],
  ["Casa del Espejo Andino", "Barco Pirata del Titicaca", 3],
  ["Barco Pirata del Titicaca", "Bosque Encantado de Paucartambo", 3],

  // Acuática
  ["Río Loco", "Piscina de Olas del Colca", 3],
  ["Río Loco", "Lago de las Sirenas", 2],
  ["Piscina de Olas del Colca", "Toboganes del Manu", 3],
  ["Toboganes del Manu", "Lago de las Sirenas", 2],

  // Conectores entre zonas (caminos principales del parque)
  ["Torre del Vértigo", "Carrusel Encantado", 7],
  ["Rueda Panorámica Inca", "Piscina de Olas del Colca", 6],
  ["Casa del Espejo Andino", "Río Loco", 8],
  ["Sendero del Puma", "Castillo de Q'enqo", 5],
  ["Rápidos del Apurímac", "Casa del Espejo Andino", 6],
  ["Laberinto de Machu", "Río Loco", 5],
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[seed] Falta MONGODB_URI en el archivo .env');
    process.exit(1);
  }

  await conectarDB(uri);

  console.log('[seed] Limpiando colecciones existentes...');
  await Atraccion.deleteMany({});
  await Camino.deleteMany({});

  console.log('[seed] Insertando atracciones...');
  const insertadas = await Atraccion.insertMany(atracciones);
  const idPorNombre = new Map(insertadas.map((a) => [a.nombre, a._id]));

  console.log('[seed] Insertando caminos...');
  const caminos = caminosPorNombre.map(([origenNombre, destinoNombre, tiempoCaminata]) => {
    const origen = idPorNombre.get(origenNombre);
    const destino = idPorNombre.get(destinoNombre);
    if (!origen || !destino) {
      throw new Error(`No se pudo resolver el camino ${origenNombre} -> ${destinoNombre}`);
    }
    return { origen, destino, tiempoCaminata };
  });
  await Camino.insertMany(caminos);

  console.log(`[seed] Listo: ${insertadas.length} atracciones, ${caminos.length} caminos.`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
