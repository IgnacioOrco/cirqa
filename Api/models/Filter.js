import mongoose from 'mongoose';

const filterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del cristal circadiano es requerido'],
      enum: {
        values: ['Clear', 'Día', 'Transición', 'Noche'],
        message: '{VALUE} no es un filtro válido. Valores permitidos: Clear, Día, Transición, Noche',
      },
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    additionalPrice: {
      type: Number,
      default: 0,
      min: [0, 'El precio adicional no puede ser negativo'],
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Filter = mongoose.model('Filter', filterSchema);

export default Filter;
