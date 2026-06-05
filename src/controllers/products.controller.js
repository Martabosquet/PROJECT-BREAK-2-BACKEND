import { productsService } from "../services/products.services.js"
// import products from "../db/products.js"
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

  // const products = productsService.getAllProducts()
  // res.json({
  //   ok: true, message: "Productos obtenidos correctamente", //mensaje de éxito
  //   count: products.length, // la cantidad de productos
  //   data: products //aquí irían los productos obtenidos de la base de datos
  // })
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
  // const productId = parseInt(req.params.id) //obtenemos el id del producto a través de los parámetros de la ruta
  // const product = productsService.getProductById(productId) //buscamos el producto en el array de productos

  // if (!product) {
  //   return res.status(404).json({
  //     ok: false,
  //     message: `Película con id: ${productId} no encontrada`, //mensaje de error si la película no se encuentra
  //   })
  // }
  // res.json({
  //   ok: true,
  //   data: product,
  //   message: `Película con id: ${productId} obtenida correctamente` //mensaje de éxito si el producto se encuentra
  // })
};

const createProduct = async (req, res, next) => {
  try {
    const { name, price, description, stock, imageUrl } = req.body //destructuring datos del body
    const newProduct = await productsService.createProduct({ name, price, description, stock, imageUrl })
    res.status(201).json({ ok: true, data: newProduct }) // 201 created
  } catch (error) {
    next(error)
  }
  // const { name, price, genre } = req.body // destructuring datos del body

  // if (!name || !price || !genre) { //hacer que sea obligatorio completar los tres campos
  //   return res.status(400).json({
  //     ok: false,
  //     message: "name, price y genre son obligatorios", //y si no se rellenan, se devuelve un error con un mensaje indicando que son obligatorios
  //   })
  // }

  // const newProduct = productsService.createProduct({ name, price, genre }) //aprovechamos el destructuring
  // res.status(201).json({
  //   ok: true,
  //   data: newProduct, //si se crea el videojuego correctamente, se devuelve en la respuesta con un status 201 indicando que se ha creado un nuevo recurso
  // })
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
  // const id = parseInt(req.params.id)
  // const updatedProduct = productsService.updateProduct(id, req.body) //no hace falta destructuring porque el service se encarga de actualizar SOLO los campos que se le pasan en el body

  // if (!updatedProduct) {
  //   return res.status(404).json({
  //     ok: false,
  //     message: "Película no encontrada",
  //   })
  // }

  // res.json({
  //   ok: true,
  //   data: updatedProduct, //se actualiza solo lo que se ha modificado
  // })
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
  // const id = parseInt(req.params.id)
  // const deletedProduct = productsService.deleteProduct(id)

  // if (!deletedProduct) {
  //   return res.status(404).json({
  //     ok: false,
  //     message: "Película no encontrada",
  //   })
  // }

  // res.json({
  //   ok: true,
  //   message: "Película eliminada correctamente",
  // })
};


export const productsController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}