import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del armazón es requerido'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'El slug identificador es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    basePrice: {
      type: Number,
      required: [true, 'El precio base es requerido'],
      min: [0, 'El precio base no puede ser negativo'],
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generar slug automáticamente antes de validar si no se envió
productSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
