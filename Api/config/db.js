import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        'La variable MONGO_URI no está definida. Verifica que exista un archivo .env en la carpeta /Api.'
      );
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Conectado exitosamente al VPS: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`[MongoDB Error]: Falló la conexión a la base de datos: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
