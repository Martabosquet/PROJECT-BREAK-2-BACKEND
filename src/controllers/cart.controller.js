import { getCart, getCartById, addItem, removeItem, decreaseItemQuantity } from "../services/cart.service.js"

export const getCartController = async (req, res, next) => {
    try {
        const cart = await getCart(String(req.user.id))
        res.json({
            ok: true,
            data: cart,
        })
    } catch (error) {
        next(error);
    }
}

export const getCartByIdController = async (req, res, next) => {
    try {
        const { cartId } = req.params

        const cart = await getCartById(cartId)

        if (!cart) {
            const error = new Error("Carrito no encontrado")
            error.statusCode = 404
            throw error
        }

        res.json({
            ok: true,
            data: cart,
        })
    } catch (error) {
        next(error);
    }
}

export const addItemController = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body
        if (!productId || !quantity) {
            const error = new Error("productId y quantity son obligatorios")
            error.statusCode = 400
            throw error
        }
        const item = await addItem(String(req.user.id), productId, quantity)
        res.status(201).json({
            ok: true,
            data: item,
        })
    } catch (error) {
        next(error);
    }
}

export const removeItemController = async (req, res, next) => {
    try {
        const { itemId } = req.params
        await removeItem(String(req.user.id), itemId)
        res.json({
            ok: true,
            message: "Elemento eliminado del carrito",
        })
    } catch (error) {
        next(error);
    }
}

export const decreaseItemQuantityController = async (req, res, next) => {
    try {
        const { itemId } = req.params
        const { quantity } = req.body
        if (!quantity || typeof quantity !== "number" || quantity <= 0) {
            const error = new Error("quantity es obligatorio y debe ser un número positivo")
            error.statusCode = 400
            throw error
        }
        const item = await decreaseItemQuantity(String(req.user.id), itemId, quantity)
        res.json({
            ok: true,
            data: item,
        })
    } catch (error) {
        next(error);
    }
}