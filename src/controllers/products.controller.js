import { productsService } from "../services/products.service.js"
//import CError, { Selector } from "../utils/CError.js"

const getProducts = async (req, res, next) => {
  try {
    const data = await productsService.getAllProducts() //obtenemos el array de productos a través del service
    res.json({
      ok: true,
      data: data, //aquí irían los productos obtenidos de la base de datos
    })
  } catch (error) {
    next(error)
  }


};

const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id
    const product = await productsService.getProductById(id)

    if (!product) {
      return res.status(404).json({
        ok: false,
        error: "Producto no encontrado",
      })
    }

    res.json({
      ok: true,
      data: product,
    })
  } catch (error) {
    next(error)
  }

};

const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const file = req.file;

    const newProduct = await productsService.createProduct(productData, file);

    res.status(201).json({ ok: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Ahora enviamos también req.file al servicio
    const updatedProduct = await productsService.updateProduct(id, req.body, req.file);

    res.json({
      ok: true,
      data: updatedProduct,
    });
  } catch (error) {
    // Si Prisma no encuentra el ID, lanzará el código P2025
    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        error: "Producto no encontrado",
      });
    }
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id
    await productsService.deleteProduct(id)

    res.json({
      ok: true,
      message: "Producto eliminado correctamente",
    })
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        error: "Producto no encontrado",
      })
    }
    next(error)
  }

};

export const productsController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}