import Filter from '../models/Filter.js';

/**
 * @desc    Listar todos los cristales circadianos y sus precios adicionales
 * @route   GET /api/filters
 * @access  Público
 */
export const getFilters = async (req, res, next) => {
  try {
    const filters = await Filter.find().sort({ additionalPrice: 1 });

    return res.status(200).json({
      success: true,
      count: filters.length,
      data: filters,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear o actualizar un cristal circadiano
 * @route   POST /api/filters
 * @access  Privado (Solo Admin)
 */
export const createFilter = async (req, res, next) => {
  try {
    const { name, description, additionalPrice, features } = req.body;

    const existingFilter = await Filter.findOne({ name });
    if (existingFilter) {
      return res.status(400).json({
        success: false,
        message: `El cristal '${name}' ya se encuentra registrado.`,
      });
    }

    const filter = await Filter.create({
      name,
      description,
      additionalPrice,
      features,
    });

    return res.status(201).json({
      success: true,
      message: 'Cristal circadiano registrado exitosamente.',
      data: filter,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Inicializar los 4 cristales circadianos de CIRQA si la colección está vacía
 * @route   POST /api/filters/seed
 * @access  Privado (Solo Admin)
 */
export const seedDefaultFilters = async (req, res, next) => {
  try {
    const count = await Filter.countDocuments();
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Los cristales circadianos ya fueron inicializados.',
      });
    }

    const defaultFilters = [
      {
        name: 'Clear',
        description: 'Cristal transparente con filtro anti-reflex y protección esencial contra luz azul digital de baja frecuencia.',
        additionalPrice: 0,
        features: ['26% Bloqueo Azul', '89.40% Transmitancia VLT', 'Protección UV400', 'Sin tinte de color'],
      },
      {
        name: 'Día',
        description: 'Cristal con tono amarillo balanceado para jornadas de trabajo frente a pantallas y luz artificial diurna.',
        additionalPrice: 3500,
        features: ['84% Bloqueo Azul', '76.17% Transmitancia VLT', 'Protección UV400', 'Anti-fatiga visual'],
      },
      {
        name: 'Transición',
        description: 'Cristal ámbar/naranja para el atardecer, sesiones continuas de gaming y caída solar.',
        additionalPrice: 4500,
        features: ['95% Bloqueo Azul', '49.93% Transmitancia VLT', 'Cero deslumbramiento', 'Preparación crepuscular'],
      },
      {
        name: 'Noche',
        description: 'Cristal rojo profundo para uso nocturno previo a dormir. Diseñado para maximizar la producción natural de melatonina.',
        additionalPrice: 5500,
        features: ['100% Bloqueo Azul', '9.53% Transmitancia VLT', 'Norma ISO 12312-1', 'No apto para conducir'],
      },
    ];

    const createdFilters = await Filter.insertMany(defaultFilters);

    return res.status(201).json({
      success: true,
      message: 'Cristales circadianos inicializados con éxito.',
      data: createdFilters,
    });
  } catch (error) {
    next(error);
  }
};
