import mongoose from 'mongoose';

const caminoSchema = new mongoose.Schema({
  origen: { type: mongoose.Schema.Types.ObjectId, ref: 'Atraccion', required: true },
  destino: { type: mongoose.Schema.Types.ObjectId, ref: 'Atraccion', required: true },
  tiempoCaminata: { type: Number, required: true, min: 0 },
});

export default mongoose.model('Camino', caminoSchema);
