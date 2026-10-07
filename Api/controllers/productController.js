import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import Product from '../models/Product.js';

/**
 * @desc    Listar todos los productos
 * @route   GET /api/products
 * @access  Público
 */
export const getProducts = async (req, res, next) => {
  try {
    const { all, sort = '-createdAt' } = req.query;

    // Si all=true se listan todos (para admin), sino solo los activos para clientes
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
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const filter = isObjectId
      ? { $or: [{ slug: slug.toLowerCase().trim() }, { _id: slug }] }
      : { slug: slug.toLowerCase().trim() };

    const product = await Product.findOne(filter);

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
 * @access  Privado (Admin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      modelCode,
      price,
      basePrice,
      stock,
      description,
      slug,
      isActive,
      hasVariants,
      variantAxisTitle,
      variants,
      images,
      image_url,
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

    const existingSlug = await Product.findOne({ slug: computedSlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un producto registrado con el slug '${computedSlug}'.`,
      });
    }

    // Verificar unicidad de código de modelo
    const finalModelCode = (modelCode || `Q-${computedSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || '001'}`)
      .trim()
      .toUpperCase();

    const existingCode = await Product.findOne({ modelCode: finalModelCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un producto registrado con el código de modelo '${finalModelCode}'.`,
      });
    }

    const finalPrice = price !== undefined ? Number(price) : Number(basePrice);
    const finalStock = stock !== undefined ? Number(stock) : 0;

    // Formatear variantes dinámicas si se envían
    let formattedVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      formattedVariants = variants.map((v, idx) => ({
        key: (v.key || v.name || `var-${idx + 1}`).toLowerCase().trim().replace(/[\s\W-]+/g, '-'),
        name: (v.name || `Variante ${idx + 1}`).trim(),
        subtitle: (v.subtitle || '').trim(),
        badgeColor: (v.badgeColor || '#FFFFFF').trim(),
        priceModifier: Number(v.priceModifier) || 0,
        isDefault: Boolean(v.isDefault),
      }));
    }

    // Formatear imágenes iniciales si vienen como strings u objetos (incluyendo variantKey)
    let formattedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      formattedImages = images.map((img, idx) => {
        if (typeof img === 'string') {
          return {
            url: img,
            tag: idx === 0 ? 'front' : 'gallery',
            variantKey: null,
            isPrimary: idx === 0,
            order: idx,
          };
        }
        return {
          url: img.url,
          tag: img.tag || 'gallery',
          variantKey: img.variantKey ? img.variantKey.trim().toLowerCase() : null,
          isPrimary: Boolean(img.isPrimary),
          order: img.order !== undefined ? Number(img.order) : idx,
        };
      });
    } else if (image_url) {
      formattedImages = [
        {
          url: image_url,
          tag: 'front',
          variantKey: null,
          isPrimary: true,
          order: 0,
        },
      ];
    }

    const product = await Product.create({
      name: name.trim(),
      modelCode: finalModelCode,
      slug: computedSlug,
      description: description ? description.trim() : '',
      price: finalPrice,
      basePrice: finalPrice,
      stock: finalStock,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      hasVariants: Boolean(hasVariants),
      variantAxisTitle: (variantAxisTitle || 'Seleccionar Variante').trim(),
      variants: formattedVariants,
      images: formattedImages,
      image_url: formattedImages[0]?.url || image_url || '',
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
 * @access  Privado (Admin)
 */
export const updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, operation, quantity } = req.body;

    let updateQuery;

    if (stock !== undefined) {
      const newStock = Number(stock);
      if (isNaN(newStock) || newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'El valor de stock debe ser un número mayor o igual a 0.',
        });
      }
      updateQuery = { $set: { stock: newStock } };
    } else if (operation && quantity !== undefined) {
      const deltaQty = Number(quantity);
      if (isNaN(deltaQty) || deltaQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad a modificar debe ser un número positivo.',
        });
      }

      const incrementValue = operation === 'add' ? deltaQty : -deltaQty;

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
 * @desc    Actualizar un producto existente completo por ID (incluyendo reordenamiento de imágenes)
 * @route   PUT /api/products/:id
 * @access  Privado (Admin)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar unicidad de slug si se cambia
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

    // Validar unicidad de modelCode si se cambia
    if (req.body.modelCode) {
      req.body.modelCode = req.body.modelCode.trim().toUpperCase();
      const codeClash = await Product.findOne({
        modelCode: req.body.modelCode,
        _id: { $ne: id },
      });
      if (codeClash) {
        return res.status(400).json({
          success: false,
          message: `El código de modelo '${req.body.modelCode}' ya pertenece a otro producto.`,
        });
      }
    }

    // Sincronizar precio y basePrice
    if (req.body.price !== undefined && req.body.basePrice === undefined) {
      req.body.basePrice = req.body.price;
    } else if (req.body.basePrice !== undefined && req.body.price === undefined) {
      req.body.price = req.body.basePrice;
    }

    // Normalizar hasVariants y variantAxisTitle si se proporcionan
    if (req.body.hasVariants !== undefined) {
      req.body.hasVariants = Boolean(req.body.hasVariants);
    }
    if (req.body.variantAxisTitle !== undefined) {
      req.body.variantAxisTitle = (req.body.variantAxisTitle || 'Seleccionar Variante').trim();
    }

    // Normalizar array de variantes si viene en req.body
    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants.map((v, idx) => ({
        _id: v._id,
        key: (v.key || v.name || `var-${idx + 1}`).toLowerCase().trim().replace(/[\s\W-]+/g, '-'),
        name: (v.name || `Variante ${idx + 1}`).trim(),
        subtitle: (v.subtitle || '').trim(),
        badgeColor: (v.badgeColor || '#FFFFFF').trim(),
        priceModifier: Number(v.priceModifier) || 0,
        isDefault: Boolean(v.isDefault),
      }));
    }

    // Si viene actualización del array de imágenes, asegurar unicidad de isPrimary y preservar variantKey
    if (Array.isArray(req.body.images)) {
      req.body.images = req.body.images.map((img) => ({
        ...img,
        variantKey: img.variantKey && img.variantKey !== 'null' ? img.variantKey.trim().toLowerCase() : null,
      }));

      const primaryCount = req.body.images.filter((img) => img.isPrimary).length;
      if (primaryCount === 0 && req.body.images.length > 0) {
        req.body.images[0].isPrimary = true;
      } else if (primaryCount > 1) {
        let firstFound = false;
        req.body.images.forEach((img) => {
          if (img.isPrimary) {
            if (!firstFound) {
              firstFound = true;
            } else {
              img.isPrimary = false;
            }
          }
        });
      }
      const primary = req.body.images.find((img) => img.isPrimary) || req.body.images[0];
      if (primary) {
        req.body.image_url = primary.url;
      }
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

    // Limpiar archivos físicos de imágenes en /uploads
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img.url && img.url.includes('/uploads/')) {
          try {
            const filename = path.basename(img.url);
            const filePath = path.resolve('uploads', filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.warn(`[Delete Product Image File Error]: ${err.message}`);
          }
        }
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

/**
 * @desc    Subir imagen individual para retrocompatibilidad
 * @route   POST /api/products/:id/image
 * @access  Privado (Admin)
 */
export const updateProductImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tag = 'front', variantKey = null } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo de imagen válido.',
      });
    }

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado para asociar la imagen.',
      });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');
    const relativePath = `/uploads/${req.file.filename}`;
    const fullImageUrl = `${protocol}://${host}${relativePath}`;

    const hasPrimary = product.images.some((img) => img.isPrimary);
    const newImageObj = {
      url: fullImageUrl,
      tag: ['front', 'side', 'angle', 'model', 'detail', 'gallery'].includes(tag) ? tag : 'front',
      variantKey: variantKey && variantKey !== 'null' ? variantKey.trim().toLowerCase() : null,
      isPrimary: !hasPrimary,
      order: product.images.length,
    };

    product.images.push(newImageObj);
    product.image_url = product.images.find((img) => img.isPrimary)?.url || fullImageUrl;

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Imagen del producto cargada y vinculada exitosamente.',
      data: product,
      image_url: fullImageUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Subir múltiples imágenes a la galería clasificada de un producto
 * @route   POST /api/products/:id/images
 * @access  Privado (Admin)
 */
export const uploadProductImagesController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tag = 'gallery', variantKey = null } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han enviado archivos de imagen válidos (campo "images").',
      });
    }

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.',
      });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');

    let currentMaxOrder = product.images.reduce((max, img) => Math.max(max, img.order || 0), -1);
    const hasPrimary = product.images.some((img) => img.isPrimary);

    const validTag = ['front', 'side', 'angle', 'model', 'detail', 'gallery'].includes(tag)
      ? tag
      : 'gallery';

    const normalizedVariantKey = variantKey && variantKey !== 'null' ? variantKey.trim().toLowerCase() : null;

    const newImageSubdocs = req.files.map((file, idx) => {
      const relativePath = `/uploads/${file.filename}`;
      const fullImageUrl = `${protocol}://${host}${relativePath}`;
      currentMaxOrder += 1;

      return {
        url: fullImageUrl,
        tag: validTag,
        variantKey: normalizedVariantKey,
        isPrimary: !hasPrimary && idx === 0,
        order: currentMaxOrder,
      };
    });

    product.images.push(...newImageSubdocs);

    // Asegurar sincronización de foto de portada
    const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
    if (primaryImg) {
      product.image_url = primaryImg.url;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: `${req.files.length} foto(s) cargada(s) y asociadas exitosamente.`,
      data: product,
      addedImages: newImageSubdocs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar una imagen puntual del producto y del disco
 * @route   DELETE /api/products/:id/images/:imageId
 * @access  Privado (Admin)
 */
export const deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.',
      });
    }

    const targetImage = product.images.id(imageId);
    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada en el catálogo del producto.',
      });
    }

    // Borrado físico del archivo en el servidor VPS
    if (targetImage.url && targetImage.url.includes('/uploads/')) {
      try {
        const filename = path.basename(targetImage.url);
        const filePath = path.resolve('uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        console.warn(`[Delete Image] No se pudo borrar el archivo físico: ${fsErr.message}`);
      }
    }

    const wasPrimary = targetImage.isPrimary;
    product.images.pull(imageId);

    // Si eliminamos la foto principal y aún quedan fotos, reasignar la primera como principal
    if (wasPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    // Sincronizar foto principal
    const currentPrimary = product.images.find((img) => img.isPrimary) || product.images[0];
    product.image_url = currentPrimary ? currentPrimary.url : '';

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente del producto y del almacenamiento.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modificar rol (tag), si es principal o la posición (order) de una imagen existente
 * @route   PATCH /api/products/:id/images/:imageId
 * @access  Privado (Admin)
 */
export const updateProductImageMetadata = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const { tag, isPrimary, order, variantKey } = req.body;

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.',
      });
    }

    const targetImage = product.images.id(imageId);
    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada en el producto.',
      });
    }

    if (tag && ['front', 'side', 'angle', 'model', 'detail', 'gallery'].includes(tag)) {
      targetImage.tag = tag;
    }

    if (variantKey !== undefined) {
      targetImage.variantKey = variantKey && variantKey !== 'null' ? variantKey.trim().toLowerCase() : null;
    }

    if (order !== undefined) {
      targetImage.order = Number(order);
    }

    if (isPrimary === true) {
      product.images.forEach((img) => {
        img.isPrimary = img._id.toString() === imageId.toString();
      });
      product.image_url = targetImage.url;
    } else if (isPrimary === false && targetImage.isPrimary) {
      targetImage.isPrimary = false;
      const fallback = product.images.find((img) => img._id.toString() !== imageId.toString());
      if (fallback) {
        fallback.isPrimary = true;
        product.image_url = fallback.url;
      }
    }

    // Reordenar array según order
    product.images.sort((a, b) => (a.order || 0) - (b.order || 0));

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Metadatos de la imagen actualizados exitosamente.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
