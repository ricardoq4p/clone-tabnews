import mongoose from "mongoose";
const cached =
  global.mongoose || (global.mongoose = { conn: null, promise: null });
export default async function connectToDatabase() {
  if (!process.env.MONGODB_URI)
    throw new Error("Defina MONGODB_URI no ambiente do servidor");
  if (cached.conn) return cached.conn;
  if (!cached.promise)
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
