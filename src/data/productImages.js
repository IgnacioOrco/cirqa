/**
 * CIRQA - Mapeo completo de fotografías de estudio de alta resolución
 * 6 Modelos Oficiales: Q 001, Q 002, Q 003, Q 004, Q 005, Q KIDS
 * Filtros Circadianos: Clear, Día (Amarillo), Transición (Naranja), Noche (Rojo)
 * Ángulos de Cámara: Frente, Perspectiva, Cenital
 */

export const PRODUCT_PHOTOS = {
  // Q 001: Classic Square - Acetato Negro Geométrico
  q001: {
    name: 'Q 001 · Classic Square',
    shape: 'square-classic',
    images: {
      clear: {
        frente: '/products/_DSC8647.webp',
        perspectiva: '/products/_DSC8678.webp',
        cenital: '/products/_DSC8611.webp',
      },
      dia: {
        frente: '/products/_DSC8649.webp',
        perspectiva: '/products/_DSC8680.webp',
        cenital: '/products/_DSC8613.webp',
      },
      transicion: {
        frente: '/products/_DSC8651.webp',
        perspectiva: '/products/_DSC8681.webp',
        cenital: '/products/_DSC8614.webp',
      },
      noche: {
        frente: '/products/_DSC8652.webp',
        perspectiva: '/products/_DSC8682.webp',
        cenital: '/products/_DSC8616.webp',
      },
    },
  },

  // Q 002: Aviator Wire - Alambre Metálico Dorado con Doble Puente
  q002: {
    name: 'Q 002 · Aviator Wire',
    shape: 'aviator-wire',
    images: {
      clear: {
        frente: '/products/_DSC8669.webp',
        perspectiva: '/products/_DSC8699.webp',
        cenital: '/products/_DSC8634.webp',
      },
      dia: {
        frente: '/products/_DSC8670.webp',
        perspectiva: '/products/_DSC8701.webp',
        cenital: '/products/_DSC8635.webp',
      },
      transicion: {
        frente: '/products/_DSC8671.webp',
        perspectiva: '/products/_DSC8703.webp',
        cenital: '/products/_DSC8640.webp',
      },
      noche: {
        frente: '/products/_DSC8672.webp',
        perspectiva: '/products/_DSC8705.webp',
        cenital: '/products/_DSC8642.webp',
      },
    },
  },

  // Q 003: Navigator Flat-Top - Doble Puente Negro Arquitectónico
  q003: {
    name: 'Q 003 · Navigator Flat-Top',
    shape: 'navigator-pilot',
    images: {
      clear: {
        frente: '/products/_DSC8655.webp',
        perspectiva: '/products/_DSC8685.webp',
        cenital: '/products/_DSC8620.webp',
      },
      dia: {
        frente: '/products/_DSC8656.webp',
        perspectiva: '/products/_DSC8686.webp',
        cenital: '/products/_DSC8621.webp',
      },
      transicion: {
        frente: '/products/_DSC8658.webp',
        perspectiva: '/products/_DSC8688.webp',
        cenital: '/products/_DSC8622.webp',
      },
      noche: {
        frente: '/products/_DSC8660.webp',
        perspectiva: '/products/_DSC8689.webp',
        cenital: '/products/_DSC8624.webp',
      },
    },
  },

  // Q 004: Oval Carey - Silueta Orgánica Carey Havana
  q004: {
    name: 'Q 004 · Oval Carey',
    shape: 'oval-carey',
    images: {
      clear: {
        frente: '/products/_DSC8662.webp',
        perspectiva: '/products/_DSC8691.webp',
        cenital: '/products/_DSC8625.webp',
      },
      dia: {
        frente: '/products/_DSC8664.webp',
        perspectiva: '/products/_DSC8692.webp',
        cenital: '/products/_DSC8626.webp',
      },
      transicion: {
        frente: '/products/_DSC8666.webp',
        perspectiva: '/products/_DSC8694.webp',
        cenital: '/products/_DSC8629.webp',
      },
      noche: {
        frente: '/products/_DSC8667.webp',
        perspectiva: '/products/_DSC8695.webp',
        cenital: '/products/_DSC8631.webp',
      },
    },
  },

  // Q 005: Round Minimal Wire - Alambre Circular
  q005: {
    name: 'Q 005 · Round Minimal Wire',
    shape: 'round-minimal',
    images: {
      clear: {
        frente: '/products/_DSC8673.webp',
        perspectiva: '/products/_DSC8706.webp',
        cenital: '/products/_DSC8638.webp',
      },
      dia: {
        frente: '/products/_DSC8674.webp',
        perspectiva: '/products/_DSC8707.webp',
        cenital: '/products/_DSC8639.webp',
      },
      transicion: {
        frente: '/products/_DSC8675.webp',
        perspectiva: '/products/_DSC8708.webp',
        cenital: '/products/_DSC8640.webp',
      },
      noche: {
        frente: '/products/_DSC8676.webp',
        perspectiva: '/products/_DSC8710.webp',
        cenital: '/products/_DSC8642.webp',
      },
    },
  },

  // Q KIDS: Kids Edition - Cristal Rosa Pastel
  qkids: {
    name: 'Q KIDS · Kids Edition',
    shape: 'round-kids',
    images: {
      clear: {
        frente: '/products/_DSC8653.webp',
        perspectiva: '/products/_DSC8683.webp',
        cenital: '/products/_DSC8618.webp',
      },
      dia: {
        frente: '/products/_DSC8654.webp',
        perspectiva: '/products/_DSC8684.webp',
        cenital: '/products/_DSC8619.webp',
      },
      transicion: {
        frente: '/products/_DSC8654.webp',
        perspectiva: '/products/_DSC8684.webp',
        cenital: '/products/_DSC8619.webp',
      },
      noche: {
        frente: '/products/_DSC8653.webp',
        perspectiva: '/products/_DSC8683.webp',
        cenital: '/products/_DSC8618.webp',
      },
    },
  },
};

// Aliases de compatibilidad para identificadores antiguos
PRODUCT_PHOTOS.q1 = PRODUCT_PHOTOS.q001;
PRODUCT_PHOTOS.q2 = PRODUCT_PHOTOS.q002;
PRODUCT_PHOTOS.q3 = PRODUCT_PHOTOS.q003;
PRODUCT_PHOTOS.q4 = PRODUCT_PHOTOS.q004;
PRODUCT_PHOTOS.q5 = PRODUCT_PHOTOS.q005;

const MODEL_MAP = {
  q001: 'q001',
  q1: 'q001',
  q002: 'q002',
  q2: 'q002',
  q003: 'q003',
  q3: 'q003',
  q004: 'q004',
  q4: 'q004',
  q005: 'q005',
  q5: 'q005',
  qkids: 'qkids',
  'q-kids': 'qkids',
  kids: 'qkids',
};

export function getProductImage(modelId, filterId = 'dia', angle = 'frente') {
  const normalizedKey = MODEL_MAP[modelId] || 'q001';
  const model = PRODUCT_PHOTOS[normalizedKey] || PRODUCT_PHOTOS['q001'];
  const filterKey = filterId === 'ambar' ? 'transicion' : filterId === 'amarillo' ? 'dia' : filterId === 'carmin' ? 'noche' : filterId;
  const filterPhotos = model.images[filterKey] || model.images['dia'] || model.images['clear'];
  return filterPhotos[angle] || filterPhotos['frente'] || filterPhotos['perspectiva'];
}
