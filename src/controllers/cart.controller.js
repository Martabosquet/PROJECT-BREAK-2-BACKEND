import { getCart, getCartById, addItem, removeItem, decreaseItemQuantity, checkout, getOrdersByUser, getOrderById } from "../services/cart.service.js"

export const getCartController = async (req, res, next) => {
    try {
        const cart = await getCart(String(req.user.id)) // Convertimos a String porque Cart.userId es String en Prisma
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
        const cart = await getCartById(req.params.cartId)
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

        const item = await addItem(String(req.user.id), productId, quantity) // Convertimos a String porque Cart.userId es String en Prisma
        res.status(201).json({
            ok: true,
            data: item,
        })
    } catch (error) {
        next(error);
    }
}

export const checkoutController = async (req, res, next) => {
    try {
        const order = await checkout(String(req.user.id)) // Convertimos a String porque Cart.userId es String en Prisma
        res.json({
            ok: true,
            data: order,
        })
    } catch (error) {
        next(error);
    }
}

export const getOrdersController = async (req, res, next) => {
    try {
        const orders = await getOrdersByUser(String(req.user.id))
        res.json({
            ok: true,
            data: orders,
        })
    } catch (error) {
        next(error)
    }
}

export const getOrderByIdController = async (req, res, next) => {
    try {
        const order = await getOrderById(String(req.user.id), req.params.orderId)

        if (!order) {
            const error = new Error("Pedido no encontrado")
            error.statusCode = 404
            throw error
        }

        res.json({
            ok: true,
            data: order,
        })
    } catch (error) {
        next(error)
    }
}

export const removeItemController = async (req, res, next) => {
    try {
        const { itemId } = req.params
        await removeItem(itemId)

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

        const item = await decreaseItemQuantity(itemId, quantity)

        if (!item) {
            const error = new Error("Elemento no encontrado en el carrito")
            error.statusCode = 404
            throw error
        }

        res.json({
            ok: true,
            data: item,
        })
    } catch (error) {
        next(error);
    }
}