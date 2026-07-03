import { productsService } from "../services/products.service.js"
import prisma from "../config/prismaClient.js"

const getProducts = async (req, res, next) => {
  try {
    const data = await productsService.getAllProducts() //obtenemos el array de productos a través del service
    res.json({
      ok: true,
      data: data,
    })
  } catch (error) {
    // Si ocurre un error, lo delegamos al middleware de manejo de errores global
    next(error)
  }
};

const getProductById = async (req, res, next) => {
  try {
    // Extraemos el identificador único del producto desde los parámetros de la URL
    const { id } = req.params;

    const product = await prisma.product.findUniqueOrThrow({     // findUniqueOrThrow lanza automáticamente un error si no lo encuentra.
      where: { id }
    });

    return res.json({ ok: true, data: product });
  } catch (error) {
    next(error); // Prisma envía su error nativo con código P2025
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

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: req.body
    });

    return res.json({ ok: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

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