import { productsService } from "../services/products.services.js"
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
        message: "Producto no encontrado",
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
    const { name, price, description, stock, imageUrl } = req.body //destructuring datos del body
    const newProduct = await productsService.createProduct({ name, price, description, stock, imageUrl })
    res.status(201).json({ ok: true, data: newProduct }) // 201 created
  } catch (error) {
    next(error)
  }

};

const updateProduct = async (req, res, next) => {
    try {
    const id = req.params.id
    const updatedProduct = await productsService.updateProduct(id, req.body)

    if (!updatedProduct) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado",
      })
    }

    res.json({
      ok: true,
      data: updatedProduct,
    })
  } catch (error) {
    next(error)
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
        message: "Producto no encontrado",
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