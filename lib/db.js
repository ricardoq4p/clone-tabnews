import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// 🔥 valida se a variável existe
if (!MONGODB_URI) {
  throw new Error("Defina a variável MONGODB_URI no .env.local");
}

// 🔥 cache global (evita múltiplas conexões no dev e na Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// 🔥 função principal de conexão
async function connectToDatabase() {
  // se já tem conexão, reutiliza
  if (cached.conn) {
    return cached.conn;
  }

  // se não tem promessa, cria
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  // aguarda conexão
  cached.conn = await cached.promise;
  return cached.conn;
}

// 🔥 exporta a função
export default connectToDatabase;
