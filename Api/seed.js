import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Conectado a MongoDB...');

    const email = 'admin@cirqa.com';
    const password = 'LacontraseniaCirqa';

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`[Seed] El administrador '${email}' ya existe en la base de datos.`);
    } else {
      // El pre('save') del modelo Admin se encarga automáticamente de hashear la contraseña
      await Admin.create({ email, password });
      console.log(`[Seed] Administrador '${email}' creado exitosamente.`);
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
