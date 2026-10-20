/**
 * CIRQA Database Health & Schema Validation Script
 * Diseñado para ejecución automatizada en Antigravity / CI / Consola.
 * Salida con código de salida: 0 = OK, 1 = Error Crítico.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env si MONGO_URI no está definido en el entorno
if (!process.env.MONGO_URI) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/cirqa';

const EXPECTED_COLLECTIONS = {
  products: { minDocs: 1, requiredKeys: ['modelCode', 'name', 'price', 'stock', 'variants', 'images'] },
  orders: { minDocs: 0, requiredKeys: ['orderNumber', 'customer', 'items', 'totalAmount', 'payment', 'status'] },
  admins: { minDocs: 1, requiredKeys: ['email'] },
  coupons: { minDocs: 0, requiredKeys: ['code', 'discountType', 'discountValue', 'isActive'] }
};

async function runHealthCheck() {
  console.log('='.repeat(60));
  console.log('🛡️  CIRQA DB HEALTH CHECK & INTEGRITY VERIFICATION');
  console.log('='.repeat(60));

  // Enmascarar credenciales sensibles para logging seguro
  const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
  console.log(`📍 Conectando a: ${maskedUri}...`);

  const startTime = Date.now();
  let hasErrors = false;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    const latency = Date.now() - startTime;
    console.log(`✅ Conexión establecida con éxito (Latencia: ${latency}ms)\n`);
  } catch (err) {
    console.error(`❌ ERROR CRÍTICO: No se pudo conectar a MongoDB: ${err.message}`);
    process.exit(1);
  }

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const existingColNames = collections.map(c => c.name);

    console.log('📦 Validando Colecciones y Cantidad de Documentos:');
    for (const [colName, rule] of Object.entries(EXPECTED_COLLECTIONS)) {
      const exists = existingColNames.includes(colName);
      if (!exists) {
        console.error(`  ❌ Colección requerida ausente: "${colName}"`);
        hasErrors = true;
        continue;
      }

      const count = await db.collection(colName).countDocuments();
      const statusIcon = count >= rule.minDocs ? '✅' : '⚠️';
      console.log(`  ${statusIcon} ${colName.padEnd(12)}: ${count} documentos (Mínimo esperado: ${rule.minDocs})`);

      if (count < rule.minDocs) {
        console.warn(`     ⚠️  ALERTA: "${colName}" tiene menos documentos de los esperados.`);
        hasErrors = true;
      }
    }

    console.log('\n🔍 Validando Integridad de Esquemas en Documentos Reales:');

    // 1. Validar muestra de Products
    const sampleProduct = await db.collection('products').findOne();
    if (sampleProduct) {
      console.log('  📦 Colección "products":');
      const missingKeys = EXPECTED_COLLECTIONS.products.requiredKeys.filter(k => !(k in sampleProduct));
      if (missingKeys.length === 0) {
        console.log(`     ✅ Estructura válida (Modelo: ${sampleProduct.modelCode} | Variantes: ${sampleProduct.variants?.length || 0} | Imágenes: ${sampleProduct.images?.length || 0})`);
      } else {
        console.error(`     ❌ Faltan campos esenciales: ${missingKeys.join(', ')}`);
        hasErrors = true;
      }
    }

    // 2. Validar muestra de Orders
    const sampleOrder = await db.collection('orders').findOne();
    if (sampleOrder) {
      console.log('  🛒 Colección "orders":');
      const missingKeys = EXPECTED_COLLECTIONS.orders.requiredKeys.filter(k => !(k in sampleOrder));
      if (missingKeys.length === 0) {
        console.log(`     ✅ Estructura válida (Última orden: ${sampleOrder.orderNumber} | Total: $${sampleOrder.totalAmount} | Estado: ${sampleOrder.status})`);
      } else {
        console.error(`     ❌ Faltan campos esenciales: ${missingKeys.join(', ')}`);
        hasErrors = true;
      }
    }

    console.log('\n' + '='.repeat(60));
    if (hasErrors) {
      console.error('❌ ESTADO GENERAL: La base de datos está online pero hay discrepancias de datos.');
      console.log('='.repeat(60));
      process.exit(1);
    } else {
      console.log('✅ ESTADO GENERAL: Todo en orden. Conexión y esquemas 100% operativos.');
      console.log('='.repeat(60));
      process.exit(0);
    }
  } catch (err) {
    console.error(`❌ Error inesperado durante la auditoría: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runHealthCheck();
