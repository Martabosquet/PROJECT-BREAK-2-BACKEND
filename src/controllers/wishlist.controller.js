import * as wishlistService from "../services/wishlist.service.js"

export const addToWishlist = async (req, res, next) => {
    try {
        // Extraemos de forma segura el userId del token JWT previamente validado (evita suplantación en body)
        const userId = String(req.user.id)
        const { productId } = req.params

        // Validación básica: aseguramos que venga el productId en los parámetros
        if (!productId) {
            const error = new Error("El id del producto es obligatorio")
            error.statusCode = 400
            throw error
        }

        // Llamamos al servicio para guardar la wishlist en MongoDB (el servicio valida que el producto exista en PostgreSQL)
        const wishlistItem = await wishlistService.addToWishlist(userId, productId)
        res.status(201).json({
            ok: true,
            data: wishlistItem,
        })
    } catch (error) {
        next(error);
    }
}

export const getWishlistByUser = async (req, res, next) => {
    try {
        // Extraemos de forma segura el userId desde la sesión de JWT descodificada
        const userId = String(req.user.id)

        const wishlistItems = await wishlistService.getWishlistByUser(userId)
        res.json({
            ok: true,
            data: wishlistItems,
        })
    } catch (error) {
        next(error);
    }
}

export const removeFromWishlist = async (req, res, next) => {
    try {
        const wishlistItem = await wishlistService.removeFromWishlist(req.params.id)

        if (!wishlistItem) {
            const error = new Error("Elemento no encontrado")
            error.statusCode = 404
            throw error
        }
        res.json({
            ok: true,
            message: "Elemento eliminado de la wishlist",
        })
    } catch (error) {
        next(error);
    }
}