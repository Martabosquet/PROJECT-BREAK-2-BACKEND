// A diferencia de validateProduct.js (pensado para la creación, donde 'name' y 'price' son obligatorios), este middleware asume que en un
// PUT cualquier campo puede venir o no venir. Solo valida el formato de los campos que SÍ están presentes en el body, sin exigir ninguno.

export const validateProductUpdate = (req, res, next) => {
    const { name, price, stock } = req.body

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({
            ok: false,
            error: "El campo 'name' debe ser un texto no vacío.",
        })
    }

    if (price !== undefined && price !== "") {
        const parsedPrice = parseFloat(price)
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({
                ok: false,
                error: "El campo 'price' debe ser un número positivo.",
            })
        }
        req.body.price = parsedPrice
    }

    if (stock !== undefined && stock !== "") {
        const parsedStock = Number(stock)
        if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
            return res.status(400).json({
                ok: false,
                error: "El campo 'stock' debe ser un número entero no negativo.",
            })
        }
        req.body.stock = parsedStock
    }

    next()
}