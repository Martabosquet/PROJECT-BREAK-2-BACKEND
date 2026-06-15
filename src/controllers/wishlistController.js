import * as wishlistService from "../services/wishlistService.js"

export const addToWishlist = async (req, res) => {
    try {
        const { userId, movieId } = req.body

        if (!userId || !movieId) {
            return res.status(400).json({
                ok: false,
                error: "Id de usuario y de película son obligatorios",
            })
        }

        const wishlistItem = await wishlistService.addToWishlist(userId, movieId)
        res.status(201).json({
            ok: true,
            data: wishlistItem,
        })
    } catch (error) {
        res.status(400).json({
            ok: false,
            error: error.message,
        })
    }
}

export const getWishlistByUser = async (req, res) => {
    try {
        const wishlistItems = await wishlistService.getWishlistByUser(
            req.params.userId,
        )
        res.json({
            ok: true,
            data: wishlistItems,
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
        })
    }
}

export const removeFromWishlist = async (req, res) => {
    try {
        const wishlistItem = await wishlistService.removeFromWishlist(req.params.id)

        if (!wishlistItem) {
            return res.status(404).json({
                ok: false,
                error: "Elemento no encontrado",
            })
        }
        res.json({
            ok: true,
            message: "Elemento eliminado de la wishlist",
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
        })
    }
}