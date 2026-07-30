import mongoose from 'mongoose';

const atraccionSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, unique: true },
  zona: { type: String, required: true, trim: true },
  popularidad: { type: Number, required: true, default: 0, min: 0 },
  tiempoEsperaFila: { type: Number, required: true, default: 0, min: 0 },
  coordenadas: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
});

export default mongoose.model('Atraccion', atraccionSchema);
