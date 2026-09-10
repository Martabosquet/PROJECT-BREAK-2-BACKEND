import * as wishlistService from "../services/wishlist.service.js";

// Controlador unificado para alternar (Añadir / Eliminar) de la wishlist
export const toggleWishlist = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        const { productId } = req.params;

        if (!productId) {
            const error = new Error("El id del producto es obligatorio");
            error.statusCode = 400;
            throw error;
        }

        const result = await wishlistService.toggleWishlist(userId, productId);
        return res.status(result.action === "added" ? 201 : 200).json({
            ok: true,
            message: result.action === "added"
                ? "Producto añadido a la wishlist"
                : "Producto eliminado de la wishlist",
            action: result.action,
            data: result.item,
        });
    } catch (error) {
        next(error);
    }
};

export const getWishlistByUser = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        const wishlistItems = await wishlistService.getWishlistByUser(userId);
        res.json({
            ok: true,
            data: wishlistItems,
        });
    } catch (error) {
        next(error);
    }
};

export const removeFromWishlist = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        const targetId = req.params.id || req.params.productId;

        // Buscamos y eliminamos coincidiendo el usuario y cualquiera de las dos propiedades posibles
        const wishlistItem = await wishlistService.removeWishlistItem(userId, targetId);

        if (!wishlistItem) {
            const error = new Error("Elemento no encontrado en la wishlist");
            error.statusCode = 404;
            throw error;
        }

        res.json({
            ok: true,
            message: "Elemento eliminado de la wishlist",
        });
    } catch (error) {
        next(error);
    }
};