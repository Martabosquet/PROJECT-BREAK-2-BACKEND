export const validateProduct = (req, res, next) => {
  const { name, price, stock } = req.body

  // 1. Validar campo 'name' (Obligatorio, string no vacío)
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      ok: false,
      error: "El campo 'name' es obligatorio y debe ser un texto.",
    })
  }

  // 2. Validar campo 'price' (Viene como String de Multer, validamos y convertimos)
  if (price === undefined || price.trim() === '') {
    return res.status(400).json({
      ok: false,
      error: "El campo 'price' es obligatorio.",
    })
  }

  const parsedPrice = parseFloat(price);
  // isNaN verifica que realmente sea un número convertible (ej: "15.99" es válido, "abc" no)
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
      ok: false,
      error: "El campo 'price' debe ser un número positivo.",
    })
  }

  // Guardamos el valor ya convertido en req.body para que el servicio lo reciba limpio
  req.body.price = parsedPrice;


  // 3. Validar campo 'stock' (Opcional, pero si se envía debe ser entero >= 0)
  if (stock !== undefined && stock !== '') {
    const parsedStock = Number(stock);

    if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      return res.status(400).json({
        ok: false,
        error: "El campo 'stock' debe ser un número entero no negativo.",
      })
    }

    // Guardamos el valor convertido
    req.body.stock = parsedStock;
  }

  next()
}