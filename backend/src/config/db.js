import dns from 'node:dns';
import mongoose from 'mongoose';

// En algunas redes/máquinas Windows, el resolver DNS por defecto de Node
// queda apuntando a 127.0.0.1 (por VPN, antivirus con "protección DNS", etc.)
// y ese proxy local rechaza las consultas SRV que necesita mongodb+srv://,
// aunque `nslookup` funcione con normalidad. Forzar servidores DNS públicos
// evita el problema sin depender de la configuración de red del equipo.
// Solo se aplica en local: en Render (y contenedores similares) las consultas
// DNS salientes a servidores externos arbitrarios quedan bloqueadas, así que
// forzar 8.8.8.8/1.1.1.1 ahí produce el error opuesto (querySrv ETIMEOUT).
if (!process.env.RENDER) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

export async function conectarDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('[db] Conectado a MongoDB');
  return mongoose.connection;
}
