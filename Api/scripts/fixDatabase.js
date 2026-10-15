import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Filter from '../models/Filter.js';

// Cargar variables de entorno desde Api/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CANONICAL_VARIANTS = ['clear', 'dia', 'transicion', 'noche'];

/**
 * Normalizador universal de claves de variantes
 */
const normalizeVariant = (v) => {
  if (!v) return null;
  const clean = v.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!clean || clean === 'null' || clean === 'undefined') return null;
  if (clean.includes('clear') || clean.includes('transp') || clean.includes('neutr') || clean.includes('blanco')) return 'clear';
  if (clean.includes('dia') || clean.includes('day') || clean.includes('amarill') || clean.includes('yellow') || clean.includes('foco')) return 'dia';
  if (clean.includes('transic') || clean.includes('transition') || clean.includes('naranj') || clean.includes('orang') || clean.includes('ambar') || clean.includes('amber')) return 'transicion';
  if (clean.includes('noch') || clean.includes('night') || clean.includes('roj') || clean.includes('red') || clean.includes('descanso')) return 'noche';
  return clean;
};

/**
 * Normalizador estricto de códigos de modelo con guion
 */
const getCanonicalModelCode = (product) => {
  const combined = `${product.modelCode || ''} ${product.slug || ''} ${product.name || ''}`.toLowerCase();
  if (combined.includes('kids')) return 'Q-KIDS';
  if (combined.includes('001') || combined.includes('q1')) return 'Q-001';
  if (combined.includes('002') || combined.includes('q2')) return 'Q-002';
  if (combined.includes('003') || combined.includes('q3')) return 'Q-003';
  if (combined.includes('004') || combined.includes('q4')) return 'Q-004';
  if (combined.includes('005') || combined.includes('q5')) return 'Q-005';

  if (product.modelCode) {
    const clean = product.modelCode.trim().toUpperCase();
    if (clean.startsWith('Q') && !clean.startsWith('Q-')) {
      return `Q-${clean.slice(1)}`;
    }
    return clean;
  }
  return null;
};

/**
 * Script Principal de Saneamiento y Normalización
 */
export const runDatabaseSanitization = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.argv[2] ||
    'mongodb://cirqa_admin:LacontraseniaCirqa@149.34.225.201:27017/cirqa_db?authSource=admin';

  console.log('================================================================');
  console.log('🚀 INICIANDO SANEAMIENTO Y MIGRACIÓN DE BASE DE DATOS (CIRQA)');
  console.log('================================================================');
  console.log(`📡 Conectando a MongoDB en: ${mongoUri.replace(/:[^:]*@/, ':****@')}`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Conexión establecida exitosamente con la base de datos.\n');

    // -------------------------------------------------------------------------
    // 1. ELIMINAR CAMPO OBSOLETO isAvailable EN PRODUCTS
    // -------------------------------------------------------------------------
    console.log('📦 PASO 1: Eliminando campo obsoleto `isAvailable` en Product...');
    const unsetResult = await Product.collection.updateMany(
      {},
      { $unset: { isAvailable: '' } }
    );
    console.log(`   ✔️ Campo 'isAvailable' removido de ${unsetResult.modifiedCount} producto(s).\n`);

    // -------------------------------------------------------------------------
    // 2. NORMALIZAR MODEL CODES Y SUBDOCUMENTOS DE IMÁGENES
    // -------------------------------------------------------------------------
    console.log('👓 PASO 2: Normalizando modelCode y subdocumentos images por producto...');
    const products = await Product.find({});
    let updatedProductsCount = 0;

    for (const prod of products) {
      let isModified = false;

      // 2.1 Normalizar modelCode (ej: Q-001, Q-002, etc.)
      const canonicalCode = getCanonicalModelCode(prod);
      if (canonicalCode && prod.modelCode !== canonicalCode) {
        console.log(`   🔄 ${prod.name || prod._id}: modelCode '${prod.modelCode}' -> '${canonicalCode}'`);
        prod.modelCode = canonicalCode;
        isModified = true;
      }

      // 2.2 Normalizar array images
      if (Array.isArray(prod.images) && prod.images.length > 0) {
        const rawImages = prod.images.map((img, idx) => ({
          _id: img._id,
          url: img.url,
          tag: img.tag || 'gallery',
          variantKey: normalizeVariant(img.variantKey),
          isPrimary: Boolean(img.isPrimary),
          isHover: Boolean(img.isHover || img.tag === 'hover'),
          order: typeof img.order === 'number' ? img.order : idx,
        }));

        // Detectar si hay fotos huérfanas sin variantKey
        const hasOrphans = rawImages.some((img) => !img.variantKey);

        if (hasOrphans) {
          const orphanImages = rawImages.filter((img) => !img.variantKey);

          let fronts = orphanImages.filter((img) => img.tag === 'front');
          // En caso de que solo una tenga tag 'front' (como en Q 002), completar frentes con 'gallery'
          if (fronts.length <= 1) {
            const galleryFronts = orphanImages.filter(
              (img) => img.tag === 'gallery' && img.tag !== 'angle' && img.tag !== 'side' && img.tag !== 'model' && img.tag !== 'lifestyle'
            );
            fronts = [...fronts, ...galleryFronts];
          }

          const angles = orphanImages.filter(
            (img) => img.tag === 'angle' || img.tag === 'side' || img.tag === 'hover'
          );
          const models = orphanImages.filter(
            (img) => img.tag === 'model' || img.tag === 'lifestyle'
          );

          const autoMap = new Map();
          const tagMap = new Map();

          CANONICAL_VARIANTS.forEach((vKey, i) => {
            if (fronts[i]) {
              const k = String(fronts[i]._id || fronts[i].url);
              autoMap.set(k, vKey);
              tagMap.set(k, 'front');
            }
            if (angles[i]) {
              const k = String(angles[i]._id || angles[i].url);
              autoMap.set(k, vKey);
              tagMap.set(k, 'angle');
            }
            if (models[i]) {
              const k = String(models[i]._id || models[i].url);
              autoMap.set(k, vKey);
              tagMap.set(k, 'model');
            }
          });

          rawImages.forEach((img) => {
            const k = String(img._id || img.url);
            if (autoMap.has(k)) {
              img.variantKey = autoMap.get(k);
              img.tag = tagMap.get(k) || img.tag;
            }
          });
        }

        // Orden secuencial limpio: 0, 1, 2...
        rawImages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const normalizedImages = rawImages.map((img, idx) => ({
          _id: img._id,
          url: img.url,
          tag: img.tag || 'gallery',
          variantKey: normalizeVariant(img.variantKey),
          isPrimary: idx === 0, // Garantizar portada en índice 0
          isHover: idx === 1 || img.tag === 'angle' || img.tag === 'hover',
          order: idx,
        }));

        prod.images = normalizedImages;
        prod.markModified('images');

        // Sincronizar image_url de portada
        if (normalizedImages[0]?.url) {
          prod.image_url = normalizedImages[0].url;
        }

        isModified = true;
      }

      // Asegurar isActive en true si está indefinido
      if (prod.isActive === undefined) {
        prod.isActive = true;
        isModified = true;
      }

      if (isModified) {
        await prod.save();
        updatedProductsCount++;
        console.log(`   ✔️ Producto saneado: ${prod.modelCode || prod.name} (${prod.images?.length || 0} imágenes normalizadas)`);
      }
    }
    console.log(`   🎉 Total productos saneados: ${updatedProductsCount}.\n`);

    // -------------------------------------------------------------------------
    // 3. INICIALIZAR COLECCIÓN FILTERS SI SE ENCUENTRA VACÍA
    // -------------------------------------------------------------------------
    console.log('🌈 PASO 3: Verificando colección `filters` (Cristales Circadianos)...');
    const filtersCount = await Filter.countDocuments();
    if (filtersCount === 0) {
      console.log('   ⚠️ Colección `filters` vacía. Creando los 4 filtros circadianos oficiales...');
      const standardFilters = [
        {
          name: 'Clear',
          description: 'Protección UV400 y filtro digital esencial sin alteración cromática para uso diario continuo.',
          additionalPrice: 0,
          features: ['Uso diario continuo', 'Sin distorsión cromática', 'Tratamiento antirreflejo multicapa'],
        },
        {
          name: 'Día',
          description: 'Filtro amarillo 450nm para pantallas de alta luminosidad y enfoque visual prolongado.',
          additionalPrice: 0,
          features: ['Bloqueo espectral de luz azul 450nm', 'Aumento de contraste y agudeza', 'Reducción del estrés visual'],
        },
        {
          name: 'Transición',
          description: 'Filtro ámbar 500nm para caída solar y preparación biológica del ritmo circadiano.',
          additionalPrice: 0,
          features: ['Bloqueo espectral de 500nm', 'Adaptación crepuscular', 'Relajación pre-nocturna'],
        },
        {
          name: 'Noche',
          description: 'Filtro rojo carmín 550nm para bloqueo total de longitudes de onda activadoras y descanso pleno.',
          additionalPrice: 0,
          features: ['Bloqueo total de luz azul y verde 550nm', 'Estímulo de melatonina endógena', 'Descanso profundo garantizado'],
        },
      ];
      await Filter.insertMany(standardFilters);
      console.log('   ✔️ 4 Filtros circadianos insertados exitosamente.\n');
    } else {
      console.log(`   ✔️ Colección 'filters' ya cuenta con ${filtersCount} filtro(s) activo(s).\n`);
    }

    // -------------------------------------------------------------------------
    // 4. CORREGIR REFERENCIA HUÉRFANA DE ÓRDENES A Q-004
    // -------------------------------------------------------------------------
    console.log('🔗 PASO 4: Verificando referencias de ítems de órdenes vinculadas a Q-004...');
    const currentQ004 = await Product.findOne({
      $or: [
        { modelCode: 'Q-004' },
        { slug: 'q-004' },
        { name: { $regex: /004|carey/i } },
      ],
    });

    if (currentQ004) {
      console.log(`   🔍 ID actual de Q-004 en MongoDB: ${currentQ004._id}`);

      // Buscar órdenes cuyos ítems se llamen Q-004 o Carey pero su 'product' sea nulo o difiera del ID actual
      const allOrders = await Order.find({
        'items.name': { $regex: /004|carey/i },
      });

      let repairedOrdersCount = 0;

      for (const ord of allOrders) {
        let orderChanged = false;

        ord.items.forEach((item) => {
          const isItemQ004 = /004|carey/i.test(item.name || '') || /004/i.test(item.modelCode || '');
          if (isItemQ004) {
            const currentItemRef = item.product ? item.product.toString() : null;
            if (currentItemRef !== currentQ004._id.toString()) {
              console.log(
                `   🔧 Reparando ítem en Orden #${ord.orderNumber || ord._id}: ref '${currentItemRef}' -> '${currentQ004._id}'`
              );
              item.product = currentQ004._id;
              item.modelCode = 'Q-004';
              orderChanged = true;
            }
          }
        });

        if (orderChanged) {
          ord.markModified('items');
          await ord.save();
          repairedOrdersCount++;
        }
      }

      console.log(`   ✔️ ${repairedOrdersCount} orden(es) con referencia huérfana reparada(s).\n`);
    } else {
      console.log('   ℹ️ No se localizó ningún producto Q-004 en el catálogo para reparar órdenes.\n');
    }

    console.log('================================================================');
    console.log('✨ MIGRACIÓN Y SANEAMIENTO COMPLETADOS CON TOTAL ÉXITO');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error fatal durante el saneamiento de la base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB.');
  }
};

// Ejecución directa si se invoca desde la terminal
if (process.argv[1] && process.argv[1].endsWith('fixDatabase.js')) {
  runDatabaseSanitization();
}
