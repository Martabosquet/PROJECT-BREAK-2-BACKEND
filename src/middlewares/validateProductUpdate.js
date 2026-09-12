// A diferencia de validateProduct.js (pensado para la creación, donde 'name' y 'price' son obligatorios), este middleware asume que en un
// PUT cualquier campo puede venir o no venir. Solo valida el formato de los campos que SÍ están presentes en el body, sin exigir ninguno.

export const validateProductUpdate = (req, res, next) => {
    const { name, price, stock, genre, director, releaseYear } = req.body

    if (Object.keys(req.body).length === 0 && !req.file) {
        return res.status(400).json({
            ok: false,
            error: "Debes enviar al menos un campo para actualizar el producto.",
        })
    }

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({
            ok: false,
            error: "El campo 'name' debe ser un texto no vacío.",
        })
    }

    if (price !== undefined && price !== "") {
        const parsedPrice = Number(price)
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
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

    if (genre !== undefined && typeof genre !== "string") {
        return res.status(400).json({ ok: false, error: "El campo 'genre' debe ser un texto." })
    }

    if (director !== undefined && typeof director !== "string") {
        return res.status(400).json({ ok: false, error: "El campo 'director' debe ser un texto." })
    }

    if (releaseYear !== undefined && releaseYear !== "") {
        const parsedYear = Number(releaseYear)
        const currentYear = new Date().getFullYear()
        if (!Number.isInteger(parsedYear) || parsedYear < 1888 || parsedYear > currentYear) {
            return res.status(400).json({ ok: false, error: "El año debe ser un entero entre 1888 y el año actual." })
        }
        req.body.releaseYear = parsedYear
    } else if (releaseYear === "") {
        req.body.releaseYear = null
    }

    next()
}