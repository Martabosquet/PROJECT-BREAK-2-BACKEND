// Este middleware se encarga de validar los campos 'name', 'price' y 'stock' recibidos en el cuerpo de la petición.
// Dado que la petición puede procesarse como FormData (Multer) para adjuntar imágenes,
// los campos numéricos suelen enviarse como strings y aquí los validamos, convertimos y reinyectamos limpios en req.body.
export const validateProduct = (req, res, next) => {
  const { name, price, stock, genre, director, releaseYear } = req.body

  // 1. Validar campo 'name': obligatorio, debe ser un string y no contener únicamente espacios
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      ok: false,
      error: "El campo 'name' es obligatorio y debe ser un texto.",
    })
  }

  // 2. Validar campo 'price': obligatorio en la creación del producto
  if (price === undefined || (typeof price === 'string' && price.trim() === '')) {
    return res.status(400).json({
      ok: false,
      error: "El campo 'price' es obligatorio.",
    })
  }

  // Convertimos a coma flotante decimal
  const parsedPrice = Number(price);
  // Verificamos que sea un número real (no NaN) y que sea mayor o igual a 0 (precio positivo)
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
      ok: false,
      error: "El campo 'price' debe ser un número positivo.",
    })
  }

  // Guardamos el valor parseado numérico en la request para que la capa de servicio trabaje directamente con números
  req.body.price = parsedPrice;

  if (genre !== undefined && typeof genre !== 'string') {
    return res.status(400).json({ ok: false, error: "El campo 'genre' debe ser un texto." })
  }

  if (director !== undefined && typeof director !== 'string') {
    return res.status(400).json({ ok: false, error: "El campo 'director' debe ser un texto." })
  }

  if (releaseYear !== undefined && releaseYear !== '') {
    const parsedYear = Number(releaseYear)
    const currentYear = new Date().getFullYear()
    if (!Number.isInteger(parsedYear) || parsedYear < 1888 || parsedYear > currentYear) {
      return res.status(400).json({ ok: false, error: "El año debe ser un entero entre 1888 y el año actual." })
    }
    req.body.releaseYear = parsedYear
  } else {
    req.body.releaseYear = null
  }

  // 3. Validar campo 'stock': opcional, pero si está presente debe ser un número entero no negativo
  if (stock !== undefined && stock !== '') {
    // Convertimos a tipo numérico
    const parsedStock = Number(stock);

    // Validamos que sea un número válido, que no sea negativo, y que represente un valor entero
    if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      return res.status(400).json({
        ok: false,
        error: "El campo 'stock' debe ser un número entero no negativo.",
      })
    }

    // Almacenamos el stock ya parseado en la request
    req.body.stock = parsedStock;
  }

  next()
}