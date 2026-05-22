import { productsService } from "../services/products.services.js"
// import products from "../db/products.js"
//import CError, { Selector } from "../utils/CError.js"

const getProducts = async (req, res) => {
  const products = productsService.getAllProducts()
  res.json({
    ok: true, message: "Productos obtenidos correctamente", //mensaje de éxito
    count: products.length, // la cantidad de productos
    data: products //aquí irían los productos obtenidos de la base de datos
  })
}

const getProductById = async (req, res) => {
  const productId = parseInt(req.params.id) //obtenemos el id del producto a través de los parámetros de la ruta
  const product = productsService.getProductById(productId) //buscamos el producto en el array de productos

  if (!product) {
    return res.status(404).json({
      ok: false,
      message: `Película con id: ${productId} no encontrada`, //mensaje de error si la película no se encuentra
    })
  }
  res.json({
    ok: true,
    data: product,
    message: `Película con id: ${productId} obtenida correctamente` //mensaje de éxito si el producto se encuentra
  })
}

const createProduct = (req, res) => {
  const { name, price, genre } = req.body // destructuring datos del body

  if (!name || !price || !genre) { //hacer que sea obligatorio completar los tres campos
    return res.status(400).json({
      ok: false,
      message: "name, price y genre son obligatorios", //y si no se rellenan, se devuelve un error con un mensaje indicando que son obligatorios
    })
  }

  const newProduct = productsService.createProduct({ name, price, genre }) //aprovechamos el destructuring
  res.status(201).json({
    ok: true,
    data: newProduct, //si se crea el videojuego correctamente, se devuelve en la respuesta con un status 201 indicando que se ha creado un nuevo recurso
  })
}

const updateProduct = (req, res) => {
  const id = parseInt(req.params.id)
  const updatedProduct = productsService.updateProduct(id, req.body) //no hace falta destructuring porque el service se encarga de actualizar SOLO los campos que se le pasan en el body

  if (!updatedProduct) {
    return res.status(404).json({
      ok: false,
      message: "Película no encontrada",
    })
  }

  res.json({
    ok: true,
    data: updatedProduct, //se actualiza solo lo que se ha modificado
  })
}

const deleteProduct = (req, res) => {
  const id = parseInt(req.params.id)
  const deletedProduct = productsService.deleteProduct(id)

  if (!deletedProduct) {
    return res.status(404).json({
      ok: false,
      message: "Película no encontrada",
    })
  }

  res.json({
    ok: true,
    message: "Película eliminada correctamente",
  })
}


export const productsController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}