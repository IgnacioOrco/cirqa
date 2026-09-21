import Product from '../models/Product.js';

/**
 * @desc    Listar todos los productos
 * @route   GET /api/products
 * @access  Público
 */
export const getProducts = async (req, res, next) => {
  try {
    const { all, sort = '-createdAt' } = req.query;

    // Si all=true se listan todos, sino solo los activos
    const filter = all === 'true' ? {} : { isActive: true };

    const products = await Product.find(filter).sort(sort);

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
 * @desc    Obtener un producto por su slug
 * @route   GET /api/products/:slug
 * @access  Público
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug: slug.toLowerCase().trim(),
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Producto con slug '${slug}' no encontrado o inactivo.`,
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
 * @desc    Crear un nuevo producto
 * @route   POST /api/products
 * @access  Privado (Admin) / Público según configuración
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      price,
      basePrice,
      stock,
      description,
      image_url,
      cloudinary_public_id,
      images,
      slug,
      isActive,
    } = req.body;

    // Validación básica de campos requeridos
    if (!name || (price === undefined && basePrice === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y el precio del producto son obligatorios.',
      });
    }

    // Slug preventivo para verificación de unicidad
    const computedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');

    const existingProduct = await Product.findOne({ slug: computedSlug });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un producto registrado con el slug '${computedSlug}'.`,
      });
    }

    const finalPrice = price !== undefined ? Number(price) : Number(basePrice);
    const finalStock = stock !== undefined ? Number(stock) : 0;

    const product = await Product.create({
      name,
      slug: computedSlug,
      description: description || '',
      price: finalPrice,
      basePrice: finalPrice,
      stock: finalStock,
      image_url: image_url || (images && images[0]) || '',
      cloudinary_public_id: cloudinary_public_id || null,
      images: images || (image_url ? [image_url] : []),
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar el stock de un producto específico
 * @route   PATCH /api/products/:id/stock
 * @access  Privado (Admin / Sistema)
 */
export const updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, operation, quantity } = req.body;

    let updateQuery;

    // Modo 1: Asignación directa de stock absoluto ({ stock: 15 })
    if (stock !== undefined) {
      const newStock = Number(stock);
      if (isNaN(newStock) || newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'El valor de stock debe ser un número mayor o igual a 0.',
        });
      }
      updateQuery = { $set: { stock: newStock } };
    }
    // Modo 2: Incremento o decremento relativo ({ operation: 'add'|'subtract', quantity: 5 })
    else if (operation && quantity !== undefined) {
      const deltaQty = Number(quantity);
      if (isNaN(deltaQty) || deltaQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad a modificar debe ser un número positivo.',
        });
      }

      const incrementValue = operation === 'add' ? deltaQty : -deltaQty;

      // Si es resta, aseguramos que el stock no baje de 0
      if (operation === 'subtract') {
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Producto no encontrado.',
          });
        }
        if (product.stock < deltaQty) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente. Stock actual: ${product.stock}, cantidad solicitada: ${deltaQty}.`,
          });
        }
      }

      updateQuery = { $inc: { stock: incrementValue } };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el nuevo valor en "stock" o la "operation" (add/subtract) y "quantity".',
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado para actualizar stock.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock actualizado exitosamente.',
      data: {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un producto existente completo por ID
 * @route   PUT /api/products/:id
 * @access  Privado (Admin)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.body.slug) {
      req.body.slug = req.body.slug.toLowerCase().trim();
      const slugClash = await Product.findOne({
        slug: req.body.slug,
        _id: { $ne: id },
      });
      if (slugClash) {
        return res.status(400).json({
          success: false,
          message: `El slug '${req.body.slug}' ya pertenece a otro producto.`,
        });
      }
    }

    // Sincronizar precio y basePrice si se envía uno
    if (req.body.price !== undefined && req.body.basePrice === undefined) {
      req.body.basePrice = req.body.price;
    } else if (req.body.basePrice !== undefined && req.body.price === undefined) {
      req.body.price = req.body.basePrice;
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado para actualizar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un producto por ID
 * @route   DELETE /api/products/:id
 * @access  Privado (Admin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado para eliminar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente.',
      data: {
        id: product._id,
        name: product.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
