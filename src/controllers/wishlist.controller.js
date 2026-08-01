import { Wishlist } from "../models/wishlist.model.js";

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

        // 🟢 Buscamos si ya existe el registro contemplando ambas posibles claves (productId o product)
        const existingItem = await Wishlist.findOne({ 
            userId, 
            $or: [{ productId: productId }, { product: productId }] 
        });

        if (existingItem) {
            // Si ya existe, lo eliminamos de forma segura por su _id
            await Wishlist.findByIdAndDelete(existingItem._id);
            return res.json({
                ok: true,
                message: "Producto eliminado de la wishlist",
                action: "removed",
            });
        } else {
            // Si no existe, lo creamos
            const newItem = await Wishlist.create({ userId, productId });
            return res.status(201).json({
                ok: true,
                message: "Producto añadido a la wishlist",
                action: "added",
                data: newItem,
            });
        }
    } catch (error) {
        next(error);
    }
};

export const getWishlistByUser = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        const wishlistItems = await Wishlist.find({ userId });
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
        const wishlistItem = await Wishlist.findOneAndDelete({
            userId,
            $or: [
                { _id: targetId.match(/^[0-9a-fA-F]{24}$/) ? targetId : null }, // Si es un ObjectId válido de Mongoose
                { productId: targetId },
                { product: targetId }
            ].filter(condition => Object.values(condition)[0] !== null)
        });

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