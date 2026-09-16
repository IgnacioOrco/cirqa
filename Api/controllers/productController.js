import Product from '../models/Product.js';

/**
 * @desc    Obtener todos los armazones activos
 * @route   GET /api/products
 * @access  Público
 */
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener detalle de un armazón por su slug
 * @route   GET /api/products/:slug
 * @access  Público
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug: slug.toLowerCase().trim(), isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Armazón con slug '${slug}' no encontrado o no disponible.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo armazón
 * @route   POST /api/products
 * @access  Privado (Solo Admin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, slug, description, basePrice, images, stock, isActive } = req.body;

    // Verificar si ya existe un producto con el mismo slug
    const generatedSlug = slug
      ? slug.toLowerCase().trim()
      : name
        ? name.toLowerCase().trim().replace(/[\s\W-]+/g, '-')
        : null;

    if (generatedSlug) {
      const existingProduct = await Product.findOne({ slug: generatedSlug });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: `Ya existe un producto registrado con el slug '${generatedSlug}'.`,
        });
      }
    }

    const product = await Product.create({
      name,
      slug: generatedSlug,
      description,
      basePrice,
      images,
      stock,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Armazón creado exitosamente.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un armazón existente por ID
 * @route   PUT /api/products/:id
 * @access  Privado (Solo Admin)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Si se envía un nuevo slug, validar que no choque con otro producto
    if (req.body.slug) {
      req.body.slug = req.body.slug.toLowerCase().trim();
      const slugClash = await Product.findOne({
        slug: req.body.slug,
        _id: { $ne: id },
      });
      if (slugClash) {
        return res.status(400).json({
          success: false,
          message: `El slug '${req.body.slug}' ya pertenece a otro armazón.`,
        });
      }
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Armazón no encontrado para actualizar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Armazón actualizado exitosamente.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un armazón por ID
 * @route   DELETE /api/products/:id
 * @access  Privado (Solo Admin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Armazón no encontrado para eliminar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Armazón eliminado exitosamente de la base de datos.',
      data: {
        id: product._id,
        name: product.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
