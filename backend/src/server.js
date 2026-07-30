import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { conectarDB } from './config/db.js';
import { parque } from './core/Parque.js';
import atraccionesRoutes from './routes/atracciones.routes.js';
import rutasRoutes from './routes/rutas.routes.js';
import caminosRoutes from './routes/caminos.routes.js';

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error('[server] Falta MONGODB_URI en el archivo .env');
    process.exit(1);
  }

  await conectarDB(MONGODB_URI);
  await parque.cargar(); // AVL + Grafo se construyen en memoria una sola vez, al iniciar

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/salud', (req, res) => {
    res.json({ estado: 'ok', cargado: parque.cargado });
  });

  app.use('/api/atracciones', atraccionesRoutes);
  app.use('/api/rutas', rutasRoutes);
  app.use('/api/caminos', caminosRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[server] Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  app.listen(PORT, () => {
    console.log(`[server] Escuchando en http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] Error al iniciar:', err);
  process.exit(1);
});
