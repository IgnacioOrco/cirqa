import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
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
    // Campo preparado para la URL segura generada por Cloudinary
    image_url: {
      type: String,
      trim: true,
      default: '',
    },
    // Identificador público opcional para gestión/eliminación directa en Cloudinary
    cloudinary_public_id: {
      type: String,
      trim: true,
      default: null,
    },
    // Galería complementaria de imágenes (mantiene retrocompatibilidad)
    images: {
      type: [String],
      default: [],
    },
    // Compatibilidad con versiones previas (basePrice mapeado)
    basePrice: {
      type: Number,
      min: [0, 'El precio base no puede ser negativo'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pre-validate para generar slug y sincronizar price/basePrice e image_url
productSchema.pre('validate', function (next) {
  // Generar slug si no está presente
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
  }

  // Sincronizar price y basePrice para retrocompatibilidad
  if (this.price !== undefined && this.basePrice === undefined) {
    this.basePrice = this.price;
  } else if (this.basePrice !== undefined && this.price === undefined) {
    this.price = this.basePrice;
  }

  // Sincronizar image_url con la primera imagen del array si no se especificó
  if (!this.image_url && this.images && this.images.length > 0) {
    this.image_url = this.images[0];
  } else if (this.image_url && (!this.images || this.images.length === 0)) {
    this.images = [this.image_url];
  }

  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
