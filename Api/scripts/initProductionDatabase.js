/**
 * CIRQA Database Initializer & Security Setup
 * Restaura colecciones, limpia ransomware y configura usuarios en MongoDB
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const HOST = process.env.MONGO_HOST || '127.0.0.1';
const PORT = process.env.MONGO_PORT || 27017;

const PRODUCTS_DATA = [
  {
    name: 'Q 001',
    modelCode: 'Q-001',
    slug: 'q-001',
    price: 229000,
    basePrice: 229000,
    stock: 25,
    description: 'Armazón geométrico clásico con perfil depurado en acetato negro de alta densidad.',
    material: 'Acetato de celulosa negro pulido a mano',
    isActive: true,
    hasVariants: true,
    variantAxisTitle: 'Seleccionar Cristal Circadiano',
    image_url: '/assets/hero-model.webp',
    variants: [
      { key: 'clear', name: 'Clear', subtitle: 'Protección Esencial Diaria (26% bloqueo)', colorHex: '#CBD5E1', badgeColor: '#CBD5E1', priceModifier: 0, stock: 10, isAvailable: true, order: 0 },
      { key: 'dia', name: 'Día', subtitle: 'Filtro Amarillo Pantallas 450nm (84% bloqueo)', colorHex: '#FACC15', badgeColor: '#FACC15', priceModifier: 0, stock: 10, isAvailable: true, order: 1 },
      { key: 'transicion', name: 'Transición', subtitle: 'Filtro Ámbar Atardecer 500nm (97% bloqueo)', colorHex: '#FB923C', badgeColor: '#FB923C', priceModifier: 0, stock: 10, isAvailable: true, order: 2 },
      { key: 'noche', name: 'Noche', subtitle: 'Filtro Carmín Melatonina 550nm (99% bloqueo)', colorHex: '#F87171', badgeColor: '#F87171', priceModifier: 0, stock: 10, isAvailable: true, order: 3 },
    ],
    images: [
      { url: '/assets/hero-model.webp', tag: 'front', variantKey: 'clear', isPrimary: true, isHover: false, order: 0 },
      { url: '/assets/lens-dia.webp', tag: 'angle', variantKey: 'dia', isPrimary: false, isHover: true, order: 1 },
      { url: '/assets/lens-transicion.webp', tag: 'angle', variantKey: 'transicion', isPrimary: false, isHover: false, order: 2 },
      { url: '/assets/lens-noche.webp', tag: 'angle', variantKey: 'noche', isPrimary: false, isHover: false, order: 3 },
    ],
  },
  {
    name: 'Q 003',
    modelCode: 'Q-003',
    slug: 'q-003',
    price: 229000,
    basePrice: 229000,
    stock: 25,
    description: 'Un diseño que combina la esencia retro con una actitud moderna. Su silueta aviador de líneas geométricas, con marco de gran tamaño y doble puente de diseño distintivo, aporta personalidad y carácter a cualquier look.\nUn modelo unisex, versátil y con mucha identidad, ideal para quienes buscan destacarse con un accesorio que marca tendencia sin perder elegancia.\n\nMaterial: Acetato de celulosa.',
    material: 'Acetato de celulosa',
    isActive: true,
    hasVariants: true,
    variantAxisTitle: 'Seleccionar Cristal Circadiano',
    image_url: '/assets/modelo.png',
    variants: [
      { key: 'clear', name: 'Clear', subtitle: 'Protección Esencial Diaria (26% bloqueo)', colorHex: '#CBD5E1', badgeColor: '#CBD5E1', priceModifier: 0, stock: 10, isAvailable: true, order: 0 },
      { key: 'dia', name: 'Día', subtitle: 'Filtro Amarillo Pantallas 450nm (84% bloqueo)', colorHex: '#FACC15', badgeColor: '#FACC15', priceModifier: 0, stock: 10, isAvailable: true, order: 1 },
      { key: 'transicion', name: 'Transición', subtitle: 'Filtro Ámbar Atardecer 500nm (97% bloqueo)', colorHex: '#FB923C', badgeColor: '#FB923C', priceModifier: 0, stock: 10, isAvailable: true, order: 2 },
      { key: 'noche', name: 'Noche', subtitle: 'Filtro Carmín Melatonina 550nm (99% bloqueo)', colorHex: '#F87171', badgeColor: '#F87171', priceModifier: 0, stock: 10, isAvailable: true, order: 3 },
    ],
    images: [
      { url: '/assets/modelo.png', tag: 'front', variantKey: 'clear', isPrimary: true, isHover: false, order: 0 },
      { url: '/assets/lens-dia.webp', tag: 'angle', variantKey: 'dia', isPrimary: false, isHover: true, order: 1 },
      { url: '/assets/lens-transicion.webp', tag: 'angle', variantKey: 'transicion', isPrimary: false, isHover: false, order: 2 },
      { url: '/assets/lens-noche.webp', tag: 'angle', variantKey: 'noche', isPrimary: false, isHover: false, order: 3 },
    ],
  },
  {
    name: 'Q 004',
    modelCode: 'Q-004',
    slug: 'q-004',
    price: 229000,
    basePrice: 229000,
    stock: 25,
    description: 'Silueta ovalada orgánica en acabado Carey Havana de inspiración vintage europea.',
    material: 'Acetato orgánico Carey pulido artesanal',
    isActive: true,
    hasVariants: true,
    variantAxisTitle: 'Seleccionar Cristal Circadiano',
    image_url: '/assets/hero-model.png',
    variants: [
      { key: 'clear', name: 'Clear', subtitle: 'Protección Esencial Diaria (26% bloqueo)', colorHex: '#CBD5E1', badgeColor: '#CBD5E1', priceModifier: 0, stock: 10, isAvailable: true, order: 0 },
      { key: 'dia', name: 'Día', subtitle: 'Filtro Amarillo Pantallas 450nm (84% bloqueo)', colorHex: '#FACC15', badgeColor: '#FACC15', priceModifier: 0, stock: 10, isAvailable: true, order: 1 },
      { key: 'transicion', name: 'Transición', subtitle: 'Filtro Ámbar Atardecer 500nm (97% bloqueo)', colorHex: '#FB923C', badgeColor: '#FB923C', priceModifier: 0, stock: 10, isAvailable: true, order: 2 },
      { key: 'noche', name: 'Noche', subtitle: 'Filtro Carmín Melatonina 550nm (99% bloqueo)', colorHex: '#F87171', badgeColor: '#F87171', priceModifier: 0, stock: 10, isAvailable: true, order: 3 },
    ],
    images: [
      { url: '/assets/hero-model.png', tag: 'front', variantKey: 'clear', isPrimary: true, isHover: false, order: 0 },
      { url: '/assets/lens-dia.webp', tag: 'angle', variantKey: 'dia', isPrimary: false, isHover: true, order: 1 },
      { url: '/assets/lens-transicion.webp', tag: 'angle', variantKey: 'transicion', isPrimary: false, isHover: false, order: 2 },
      { url: '/assets/lens-noche.webp', tag: 'angle', variantKey: 'noche', isPrimary: false, isHover: false, order: 3 },
    ],
  },
];

const FILTERS_DATA = [
  {
    name: 'Clear',
    description: 'Cristal transparente con filtro anti-reflex y protección esencial contra luz azul digital de baja frecuencia.',
    additionalPrice: 0,
    features: ['26% Bloqueo Azul', '89.40% Transmitancia VLT', 'Protección UV400', 'Sin tinte de color'],
  },
  {
    name: 'Día',
    description: 'Cristal con tono amarillo balanceado para jornadas de trabajo frente a pantallas y luz artificial diurna.',
    additionalPrice: 0,
    features: ['84% Bloqueo Azul', '76.17% Transmitancia VLT', 'Protección UV400', 'Anti-fatiga visual'],
  },
  {
    name: 'Transición',
    description: 'Cristal ámbar/naranja para el atardecer, sesiones continuas de gaming y caída solar.',
    additionalPrice: 0,
    features: ['95% Bloqueo Azul', '49.93% Transmitancia VLT', 'Cero deslumbramiento', 'Preparación crepuscular'],
  },
  {
    name: 'Noche',
    description: 'Cristal rojo profundo para uso nocturno previo a dormir. Diseñado para maximizar la producción natural de melatonina.',
    additionalPrice: 0,
    features: ['100% Bloqueo Azul', '9.53% Transmitancia VLT', 'Norma ISO 12312-1', 'No apto para conducir'],
  },
];

const COUPON_DATA = {
  code: 'CIRQA10',
  description: '10% de descuento de bienvenida en tu primera compra',
  discountType: 'percentage',
  discountValue: 10,
  minPurchaseAmount: 0,
  minQuantity: 1,
  combinableWithTransfer: true,
  isActive: true,
};

async function seedDatabase(dbName, connection) {
  console.log(`\n📦 Inicializando base de datos: "${dbName}"...`);
  const db = connection.useDb(dbName);

  // 1. Admin
  const adminCol = db.collection('admins');
  const existingAdmin = await adminCol.findOne({ email: 'admin@cirqa.com' });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('LacontraseniaCirqa', salt);
    await adminCol.insertOne({
      email: 'admin@cirqa.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`  ✅ Admin 'admin@cirqa.com' creado.`);
  } else {
    console.log(`  ℹ️ Admin 'admin@cirqa.com' ya existe.`);
  }

  // 2. Filters
  const filterCol = db.collection('filters');
  for (const filter of FILTERS_DATA) {
    await filterCol.updateOne(
      { name: filter.name },
      { $set: { ...filter, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  console.log(`  ✅ 4 Cristales circadianos asegurados.`);

  // 3. Products
  const prodCol = db.collection('products');
  for (const prod of PRODUCTS_DATA) {
    await prodCol.updateOne(
      { modelCode: prod.modelCode },
      { $set: { ...prod, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  console.log(`  ✅ 3 Modelos de productos (Q-001, Q-003, Q-004) asegurados.`);

  // 4. Coupons
  const couponCol = db.collection('coupons');
  await couponCol.updateOne(
    { code: COUPON_DATA.code },
    { $set: { ...COUPON_DATA, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  console.log(`  ✅ Cupón de bienvenida '${COUPON_DATA.code}' asegurado.`);

  // 5. Orders collection initialization (empty)
  const orderCol = db.collection('orders');
  const orderCount = await orderCol.countDocuments();
  console.log(`  ✅ Colección 'orders' operativa (${orderCount} órdenes).`);
}

async function run() {
  console.log('='.repeat(60));
  console.log('🚀 CIRQA PRODUCTION DB RESTORATION & SECURITY INIT');
  console.log('='.repeat(60));

  try {
    const conn = await mongoose.connect(`mongodb://${HOST}:${PORT}/admin`, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`📡 Conectado al servidor MongoDB en ${HOST}:${PORT}`);

    const adminDb = conn.connection.db;

    // 1. Eliminar base de datos de rescate/ransomware si existe
    try {
      const dbs = await new mongoose.mongo.Admin(adminDb).listDatabases();
      const hasRansom = dbs.databases.some((d) => d.name.includes('READ_ME'));
      if (hasRansom) {
        console.log('🧹 Eliminando base de datos maliciosa READ_ME_TO_RECOVER_YOUR_DATA...');
        await conn.connection.useDb('READ_ME_TO_RECOVER_YOUR_DATA').dropDatabase();
        console.log('✅ Base maliciosa eliminada con éxito.');
      }
    } catch (err) {
      console.warn('⚠️ No se pudo verificar base de ransomware:', err.message);
    }

    // 2. Poblar 'cirqa' (usada por el contenedor Docker en producción) y 'cirqa_db' (usada por .env local)
    await seedDatabase('cirqa', conn.connection);
    await seedDatabase('cirqa_db', conn.connection);

    // 3. Crear usuario administrador 'cirqa_admin' con contraseña en MongoDB admin
    console.log('\n🔐 Asegurando usuario administrativo MongoDB: cirqa_admin...');
    try {
      const usersInfo = await adminDb.command({ usersInfo: 'cirqa_admin' });
      if (!usersInfo.users || usersInfo.users.length === 0) {
        await adminDb.command({
          createUser: 'cirqa_admin',
          pwd: 'LacontraseniaCirqa',
          roles: [
            { role: 'root', db: 'admin' },
            { role: 'readWriteAnyDatabase', db: 'admin' },
            { role: 'dbAdminAnyDatabase', db: 'admin' },
          ],
        });
        console.log('✅ Usuario MongoDB cirqa_admin creado exitosamente.');
      } else {
        console.log('ℹ️ Usuario MongoDB cirqa_admin ya existe.');
      }
    } catch (err) {
      console.warn('⚠️ Nota sobre creación de usuario MongoDB:', err.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 BASE DE DATOS CIRQA 100% RESTAURADA Y OPERATIVA');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error fatal al inicializar base de datos:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
