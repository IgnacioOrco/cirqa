import mongoose from 'mongoose';

/**
 * Subdocumento de Imagen Clasificada
 */
const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'La URL de la imagen es obligatoria'],
      trim: true,
    },
    tag: {
      type: String,
      enum: ['front', 'side', 'angle', 'model', 'detail', 'gallery'],
      default: 'gallery',
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/**
 * Esquema Principal del Producto
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    modelCode: {
      type: String,
      required: [true, 'El código de modelo es obligatorio (ej. Q-001)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'El precio del producto es obligatorio'],
      min: [0, 'El precio no puede ser un valor negativo'],
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser un valor negativo'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Galería estructurada de fotos con categorización y orden
    images: {
      type: [productImageSchema],
      default: [],
    },
    // Campo de retrocompatibilidad con componentes existentes
    image_url: {
      type: String,
      trim: true,
      default: '',
    },
    // Compatibilidad retroactiva
    basePrice: {
      type: Number,
      min: [0, 'El precio base no puede ser negativo'],
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pre-validate para generar slug, modelCode y sincronizar foto principal
productSchema.pre('validate', function (next) {
  // 1. Generar slug si no está presente
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
  }

  // 2. Generar modelCode si no viene provisto
  if (!this.modelCode && this.name) {
    this.modelCode = `Q-${(this.slug || this.name).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || '001'}`;
  }

  // 3. Sincronizar price y basePrice para retrocompatibilidad
  if (this.price !== undefined && this.basePrice === undefined) {
    this.basePrice = this.price;
  } else if (this.basePrice !== undefined && this.price === undefined) {
    this.price = this.basePrice;
  }

  // 4. Garantizar una única foto primaria y sincronizar image_url
  if (this.images && this.images.length > 0) {
    // Si ninguna está marcada como primaria, marcar la primera
    const primaryImages = this.images.filter((img) => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Dejar solo la primera marcada
      let foundFirst = false;
      this.images.forEach((img) => {
        if (img.isPrimary) {
          if (!foundFirst) {
            foundFirst = true;
          } else {
            img.isPrimary = false;
          }
        }
      });
    }

    // Ordenar imágenes por campo order ascendente
    this.images.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Sincronizar image_url con la foto primaria
    const primary = this.images.find((img) => img.isPrimary) || this.images[0];
    if (primary) {
      this.image_url = primary.url;
    }
  } else if (this.image_url) {
    // Si viene image_url antigua y el array images está vacío, creamos el primer subdocumento
    this.images = [
      {
        url: this.image_url,
        tag: 'front',
        isPrimary: true,
        order: 0,
      },
    ];
  }

  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
