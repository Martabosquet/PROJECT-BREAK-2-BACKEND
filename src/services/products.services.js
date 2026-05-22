import products from "../db/products.js"

const getAllProducts = () => { //no hay que tocar nada, solo devolver el array de videojuegos
  return products
}

const getProductById = (id) => { // find devuelve el primer elemento del array que cumpla la condición dada, o undefined si no encuentra ninguno
  return products.find((product) => product.id === id)
}

const createProduct = (data) => { //data es lo que relleno en el body, es un objeto con las propiedades name, year y genre
  const newProduct = {
    id: Date.now(), // Simulación rudimentaria de ID único
    ...data, // me traigo toda la info que ya tenía data (body) y se la añado al nuevo objeto
  }
  products.push(newProduct) // añado al array
  return newProduct // devuelvo el elemento creado
}

const updateProduct = (id, data) => {
  const productIndex = products.findIndex((product) => product.id === id) //findIndex devuelve el índice del elemento encontrado o -1 si no lo encuentra

  if (productIndex === -1) { //para números usamos -1 porque es el valor que devuelve findIndex cuando no encuentra el elemento buscado
    return null 
  }

  products[productIndex] = {
    ...products[productIndex], // propiedades antiguas del producto que no se han modificado
    ...data, // las nuevas propiedades que quiero actualizar, si hay alguna propiedad con el mismo nombre que la antigua, se sobreescribe
  }

  return products[productIndex]
}

const deleteProduct = (id) => { 
  const productIndex = products.findIndex((product) => product.id === id) 

  if (productIndex === -1) {  
    return false
  }

  products.splice(productIndex, 1) // splice modifica el array original (elimina el elemento en el índice dado y nº de elementos a eliminar, en este caso 1)
  return true
}

export const productsService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}