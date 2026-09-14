/**
 * CIRQA - Mapeo completo de fotografías de estudio de alta resolución
 * 5 Familias de Armazones x 4 Filtros Circadianos x 3 Ángulos de Cámara
 */

export const PRODUCT_PHOTOS = {
  // Q1: Classic Square (CB404) - Acetato Geométrico
  q1: {
    name: 'Modelo Q1 · Classic Square',
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

  // Q2: Aviator Modern (CB10) - Doble Puente Arquitectónico
  q2: {
    name: 'Modelo Q2 · Aviator Modern',
    shape: 'aviator-modern',
    images: {
      clear: {
        frente: '/products/_DSC8655.webp',
        perspectiva: '/products/_DSC8685.webp',
        cenital: '/products/_DSC8620.webp',
      },
      dia: {
        frente: '/products/_DSC8656.webp',
        perspectiva: '/products/_DSC8686.webp',
        cenital: '/products/_DSC8620.webp',
      },
      transicion: {
        frente: '/products/_DSC8658.webp',
        perspectiva: '/products/_DSC8688.webp',
        cenital: '/products/_DSC8621.webp',
      },
      noche: {
        frente: '/products/_DSC8660.webp',
        perspectiva: '/products/_DSC8689.webp',
        cenital: '/products/_DSC8622.webp',
      },
    },
  },

  // Q3: Oval Carey (Havana) - Silueta Orgánica
  q3: {
    name: 'Modelo Q3 · Oval Carey',
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

  // Q4: Gold Aviator Metal - Doble Barra Dorada
  q4: {
    name: 'Modelo Q4 · Gold Aviator Wire',
    shape: 'aviator-wire',
    images: {
      clear: {
        frente: '/products/_DSC8669.webp',
        perspectiva: '/products/_DSC8699.webp',
        cenital: '/products/_DSC8669.webp',
      },
      dia: {
        frente: '/products/_DSC8670.webp',
        perspectiva: '/products/_DSC8701.webp',
        cenital: '/products/_DSC8670.webp',
      },
      transicion: {
        frente: '/products/_DSC8671.webp',
        perspectiva: '/products/_DSC8703.webp',
        cenital: '/products/_DSC8671.webp',
      },
      noche: {
        frente: '/products/_DSC8672.webp',
        perspectiva: '/products/_DSC8705.webp',
        cenital: '/products/_DSC8672.webp',
      },
    },
  },

  // Q5: Silver Round Minimal - Titanio Redondeado
  q5: {
    name: 'Modelo Q5 · Silver Round Minimal',
    shape: 'round-silver',
    images: {
      clear: {
        frente: '/products/_DSC8673.webp',
        perspectiva: '/products/_DSC8706.webp',
        cenital: '/products/_DSC8673.webp',
      },
      dia: {
        frente: '/products/_DSC8674.webp',
        perspectiva: '/products/_DSC8707.webp',
        cenital: '/products/_DSC8674.webp',
      },
      transicion: {
        frente: '/products/_DSC8675.webp',
        perspectiva: '/products/_DSC8708.webp',
        cenital: '/products/_DSC8675.webp',
      },
      noche: {
        frente: '/products/_DSC8676.webp',
        perspectiva: '/products/_DSC8710.webp',
        cenital: '/products/_DSC8676.webp',
      },
    },
  },
};

export function getProductImage(modelId, filterId = 'dia', angle = 'frente') {
  const model = PRODUCT_PHOTOS[modelId] || PRODUCT_PHOTOS['q1'];
  const filterKey = filterId === 'ambar' ? 'transicion' : filterId === 'amarillo' ? 'dia' : filterId === 'carmin' ? 'noche' : filterId;
  const filterPhotos = model.images[filterKey] || model.images['dia'] || model.images['clear'];
  return filterPhotos[angle] || filterPhotos['frente'] || filterPhotos['perspectiva'];
}
