import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import Product from '../models/Product.js';

export const normalizeVariant = (v) => {
  if (!v) return null;
  const clean = v.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!clean || clean === 'null' || clean === 'undefined') return null;
  if (clean.includes('clear') || clean.includes('transp') || clean.includes('neutr')) return 'clear';
  if (clean.includes('dia') || clean.includes('day') || clean.includes('amarill') || clean.includes('yellow')) return 'dia';
  if (clean.includes('transic') || clean.includes('naranj') || clean.includes('orang') || clean.includes('amber')) return 'transicion';
  if (clean.includes('noch') || clean.includes('night') || clean.includes('roj') || clean.includes('red') || clean.includes('sunset')) return 'noche';
  return clean;
};

export const VALID_IMAGE_TAGS = ['front', 'side', 'angle', 'model', 'lifestyle', 'gallery', 'detail', 'hover', 'unassigned'];

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
          tag: VALID_IMAGE_TAGS.includes(img.tag) ? img.tag : 'gallery',
          variantKey: normalizeVariant(img.variantKey),
          isPrimary: Boolean(img.isPrimary),
          isHover: Boolean(img.isHover || img.tag === 'hover'),
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
          isHover: false,
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

    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado para actualizar.',
      });
    }

    // Validar unicidad de slug si se cambia
    if (req.body.slug) {
      const cleanSlug = req.body.slug.toLowerCase().trim();
      const slugClash = await Product.findOne({
        slug: cleanSlug,
        _id: { $ne: product._id },
      });
      if (slugClash) {
        return res.status(400).json({
          success: false,
          message: `El slug '${req.body.slug}' ya pertenece a otro producto.`,
        });
      }
      product.slug = cleanSlug;
    }

    // Validar unicidad de modelCode si se cambia
    if (req.body.modelCode) {
      const cleanCode = req.body.modelCode.trim().toUpperCase();
      const codeClash = await Product.findOne({
        modelCode: cleanCode,
        _id: { $ne: product._id },
      });
      if (codeClash) {
        return res.status(400).json({
          success: false,
          message: `El código de modelo '${req.body.modelCode}' ya pertenece a otro producto.`,
        });
      }
      product.modelCode = cleanCode;
    }

    if (req.body.name !== undefined) product.name = req.body.name.trim();
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    if (req.body.isActive !== undefined) product.isActive = Boolean(req.body.isActive);
    if (req.body.lensWidth !== undefined) product.lensWidth = req.body.lensWidth;
    if (req.body.bridgeWidth !== undefined) product.bridgeWidth = req.body.bridgeWidth;
    if (req.body.templeLength !== undefined) product.templeLength = req.body.templeLength;

    // Sincronizar precio y basePrice
    if (req.body.price !== undefined) {
      product.price = Number(req.body.price);
      if (req.body.basePrice === undefined) product.basePrice = product.price;
    }
    if (req.body.basePrice !== undefined) {
      product.basePrice = Number(req.body.basePrice);
      if (req.body.price === undefined) product.price = product.basePrice;
    }

    // Normalizar hasVariants y variantAxisTitle si se proporcionan
    if (req.body.hasVariants !== undefined) {
      product.hasVariants = Boolean(req.body.hasVariants);
    }
    if (req.body.variantAxisTitle !== undefined) {
      product.variantAxisTitle = (req.body.variantAxisTitle || 'Seleccionar Variante').trim();
    }

    // Normalizar array de variantes si viene en req.body
    if (Array.isArray(req.body.variants)) {
      product.variants = req.body.variants.map((v, idx) => ({
        _id: v._id,
        key: (v.key || v.name || `var-${idx + 1}`).toLowerCase().trim().replace(/[\s\W-]+/g, '-'),
        name: (v.name || `Variante ${idx + 1}`).trim(),
        subtitle: (v.subtitle || '').trim(),
        badgeColor: (v.badgeColor || '#FFFFFF').trim(),
        priceModifier: Number(v.priceModifier) || 0,
        isDefault: Boolean(v.isDefault),
      }));
      product.markModified('variants');
    }

    // Soporte explícito para actualizar array images con todos sus metadatos
    const validTags = VALID_IMAGE_TAGS;
    if (Array.isArray(req.body.images)) {
      product.images = req.body.images.map((img, idx) => ({
        _id: img._id || undefined,
        url: img.url,
        tag: validTags.includes(img.tag) ? img.tag : 'front',
        variantKey: normalizeVariant(img.variantKey),
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover),
        order: typeof img.order === 'number' ? img.order : idx,
      }));
      product.markModified('images');

      const primary = product.images.find((img) => img.isPrimary) || product.images[0];
      if (primary) {
        product.image_url = primary.url;
      }
    } else if (req.body.image_url) {
      product.image_url = req.body.image_url;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente.',
      data: product,
      product,
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
    const tag = req.body?.tag || req.query?.tag || 'front';
    const variantKey = req.body?.variantKey ?? req.query?.variantKey ?? null;
    const isPrimary = req.body?.isPrimary ?? req.query?.isPrimary;
    const isHover = req.body?.isHover ?? req.query?.isHover;

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

    if (!Array.isArray(product.images)) {
      product.images = [];
    }

    const hasPrimary = product.images.some((img) => img.isPrimary);
    const validTag = VALID_IMAGE_TAGS.includes(tag) ? tag : (tag === 'hover' ? 'gallery' : 'front');
    const newImageObj = {
      _id: new mongoose.Types.ObjectId(),
      url: fullImageUrl,
      tag: validTag,
      variantKey: normalizeVariant(variantKey),
      isPrimary: isPrimary !== undefined ? Boolean(isPrimary === true || isPrimary === 'true') : !hasPrimary,
      isHover: isHover !== undefined ? Boolean(isHover === true || isHover === 'true') : Boolean(tag === 'hover'),
      order: product.images.length,
    };

    product.images.push(newImageObj);
    const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
    product.image_url = primaryImg ? primaryImg.url : fullImageUrl;

    product.markModified('images');
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
    const { tag, isPrimary, isHover, variantKey } = req.body;
    const normalizedVariantKey = normalizeVariant(variantKey || req.query?.variantKey);

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

    if (!Array.isArray(product.images)) {
      product.images = [];
    }

    const maxOrder = product.images.reduce((max, img) => Math.max(max, img.order || 0), -1);
    const validTags = VALID_IMAGE_TAGS;

    req.files.forEach((file, index) => {
      const shouldBePrimary = isPrimary !== undefined 
        ? Boolean(isPrimary === 'true' || isPrimary === true) 
        : (product.images.length === 0 && index === 0);

      product.images.push({
        url: `/uploads/${file.filename}`,
        tag: validTags.includes(tag) ? tag : 'front',
        variantKey: normalizedVariantKey,
        isPrimary: shouldBePrimary,
        isHover: isHover === 'true' || isHover === true,
        order: maxOrder + 1 + index,
      });
    });

    // Asegurar sincronización de foto de portada
    const primaryImg = product.images.find((img) => img.isPrimary) || product.images[0];
    if (primaryImg) {
      product.image_url = primaryImg.url;
    }

    product.markModified('images');
    await product.save();

    return res.status(200).json({
      success: true,
      message: `${req.files.length} foto(s) cargada(s) y asociadas exitosamente.`,
      product,
      data: product,
      addedImages: product.images.slice(-req.files.length),
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
    const { url } = req.body || {};

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

    if (!Array.isArray(product.images)) {
      product.images = [];
    }

    const targetKey = String(imageId || url || '').trim();

    // Búsqueda resiliente de la imagen objetivo
    let targetImage = null;
    if (imageId && typeof product.images.id === 'function') {
      try {
        targetImage = product.images.id(imageId);
      } catch (err) {
        targetImage = null;
      }
    }
    if (!targetImage) {
      targetImage = product.images.find((img) => {
        const idVal = img?._id ? String(img._id) : String(img?.id || '');
        const urlVal = img?.url ? String(img.url) : '';
        return (
          (targetKey && idVal === targetKey) ||
          (targetKey && urlVal === targetKey) ||
          (url && urlVal === String(url))
        );
      });
    }

    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada en el catálogo del producto.',
      });
    }

    // Borrado físico del archivo en el servidor VPS si corresponde
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

    const wasPrimary = Boolean(targetImage.isPrimary);
    const targetIdStr = targetImage._id ? String(targetImage._id) : targetKey;
    const targetUrl = targetImage.url ? String(targetImage.url) : (url ? String(url) : '');

    // 1. Filtrar el array product.images para remover el elemento seleccionado
    product.images = product.images.filter((img) => {
      const idVal = img?._id ? String(img._id) : String(img?.id || '');
      const urlVal = img?.url ? String(img.url) : '';
      if (targetIdStr && idVal === targetIdStr) return false;
      if (targetUrl && urlVal === targetUrl) return false;
      return true;
    });

    // 2. Reordenamiento secuencial obligatorio: Recorrer el array resultante de imágenes y reasignar la propiedad order de forma consecutiva empezando desde 0
    product.images = product.images.map((img, index) => ({
      ...(img.toObject ? img.toObject() : img),
      order: index,
    }));

    // Si eliminamos la foto principal y aún quedan fotos, o no queda ninguna marcada como principal, reasignar la primera como principal
    if (product.images.length > 0) {
      const hasPrimary = product.images.some((img) => img.isPrimary);
      if (!hasPrimary || wasPrimary) {
        product.images[0].isPrimary = true;
      }
    }

    // Sincronizar foto principal
    const currentPrimary = product.images.find((img) => img.isPrimary) || product.images[0];
    const newImageUrl = currentPrimary ? currentPrimary.url : '';
    product.image_url = newImageUrl;

    // 3. Marcar el campo como modificado y persistir
    product.markModified('images');
    await product.save();

    // 4. Responder enviando el producto actualizado con sus índices limpios y sincronizados
    return res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente del producto y reindexada.',
      product,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modificar rol (tag), si es principal o hover, o la posición (order) de una imagen existente
 * @route   PATCH /api/products/:id/images/:imageId
 * @access  Privado (Admin)
 */
export const updateImageMetadata = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const { tag, isPrimary, isHover, order, variantKey } = req.body;

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

    if (!Array.isArray(product.images)) {
      product.images = [];
    }

    // Asegurar que cada imagen tenga _id para evitar errores con fotos legacy
    product.images.forEach((img) => {
      if (!img._id) {
        img._id = new mongoose.Types.ObjectId();
      }
    });

    const targetIdStr = String(imageId);

    // Búsqueda resiliente de la imagen objetivo
    let targetImage = null;
    if (typeof product.images.id === 'function') {
      try {
        targetImage = product.images.id(imageId);
      } catch (err) {
        targetImage = null;
      }
    }
    if (!targetImage) {
      targetImage = product.images.find((img) => {
        const idVal = img?._id ? String(img._id) : String(img?.id || '');
        return idVal === targetIdStr;
      });
    }

    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada en el producto.',
      });
    }

    const validTags = VALID_IMAGE_TAGS;

    if (tag) {
      if (validTags.includes(tag)) {
        targetImage.tag = tag;
      } else if (tag === 'hover') {
        targetImage.isHover = true;
      }
    }

    if (variantKey !== undefined || req.body.variantKey !== undefined) {
      targetImage.variantKey = normalizeVariant(req.body.variantKey !== undefined ? req.body.variantKey : variantKey);
    }

    if (order !== undefined) {
      targetImage.order = Number(order);
    }

    const currentVariantKey = targetImage.variantKey;

    // Manejo de isPrimary por variante sin pisar a los otros colores
    if (isPrimary !== undefined) {
      const boolPrimary = Boolean(isPrimary === true || isPrimary === 'true');
      targetImage.isPrimary = boolPrimary;

      if (boolPrimary) {
        // Desmarcar isPrimary ÚNICAMENTE en las otras fotos de esa misma variantKey
        product.images.forEach((img) => {
          const idVal = img?._id ? String(img._id) : String(img?.id || '');
          if (idVal !== targetIdStr) {
            const sameVariant = currentVariantKey
              ? (img.variantKey === currentVariantKey)
              : (!img.variantKey || img.variantKey === 'null');
            if (sameVariant) {
              img.isPrimary = false;
            }
          }
        });

        // Sincronizar portada general si es la foto general o si no hay portada aún
        if (!currentVariantKey || !product.image_url) {
          product.image_url = targetImage.url;
        }
      }
    }

    // Manejo de isHover por variante sin pisar a los otros colores
    if (isHover !== undefined) {
      const boolHover = Boolean(isHover === true || isHover === 'true');
      targetImage.isHover = boolHover;

      if (boolHover) {
        // Desmarcar isHover ÚNICAMENTE en las otras fotos de esa misma variantKey
        product.images.forEach((img) => {
          const idVal = img?._id ? String(img._id) : String(img?.id || '');
          if (idVal !== targetIdStr) {
            const sameVariant = currentVariantKey
              ? (img.variantKey === currentVariantKey)
              : (!img.variantKey || img.variantKey === 'null');
            if (sameVariant) {
              img.isHover = false;
            }
          }
        });
      }
    }

    if (tag === 'hover') {
      targetImage.isHover = true;
      product.images.forEach((img) => {
        const idVal = img?._id ? String(img._id) : String(img?.id || '');
        if (idVal !== targetIdStr) {
          const sameVariant = currentVariantKey
            ? (img.variantKey === currentVariantKey)
            : (!img.variantKey || img.variantKey === 'null');
          if (sameVariant) {
            img.isHover = false;
          }
        }
      });
    }

    // Reordenar array según order si tienen definido
    if (order !== undefined) {
      product.images.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    product.markModified('images');
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Metadatos de la imagen actualizados exitosamente.',
      product,
      data: product,
    });
  } catch (error) {
    console.error('[updateImageMetadata Error]:', error);
    next(error);
  }
};

export const updateProductImageMetadata = updateImageMetadata;

