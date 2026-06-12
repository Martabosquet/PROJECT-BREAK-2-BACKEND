// Se ejecuta antes del controller en la ruta POST /products
// Verifica que el body contiene los campos obligatorios

export const validateProduct = (req, res, next) => {
  const { title } = req.body
  if (!title) {
    return res.status(400).json({
      ok: false,
      error: "El campo title es obligatorio",
    })
  }

  next()
}