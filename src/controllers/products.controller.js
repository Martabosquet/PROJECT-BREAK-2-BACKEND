import { productsService } from "../services/products.service.js"

const getProducts = async (req, res, next) => {
  try {
    const data = await productsService.getAllProducts()
    res.json({
      ok: true,
      data: data,
    })
  } catch (error) {
    next(error)
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(id);

    if (!product) {
      const error = new Error("Producto no encontrado");
      error.statusCode = 404;
      throw error;
    }

    return res.json({ ok: true, data: product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const file = req.file; // Extraemos el archivo cargado (imagen) si está presente (gracias a Multer)
    const newProduct = await productsService.createProduct(productData, file);
    res.status(201).json({ ok: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file; // Igual que en createProduct, soportamos actualizar la imagen
    // delegamos en el service, que sí filtra los campos permitidos y sí sube la imagen a Cloudinary si llega.
    const updatedProduct = await productsService.updateProduct(id, req.body, file);
    return res.json({ ok: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productsService.deleteProduct(id);
    return res.json({ ok: true, message: "Producto eliminado con éxito" });
  } catch (error) {
    next(error);
  }
};

export const productsController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}