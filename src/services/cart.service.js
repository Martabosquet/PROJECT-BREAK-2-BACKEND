import prisma from "../config/prismaClient.js"

// Obtenemos el carrito active del user y si no existe lo crea
export const getCart = async (userId) => {
    const normalizedUserId = String(userId)
    let cart = await prisma.cart.findFirst({
        where: { userId: normalizedUserId, status: "ACTIVE" },
        include: {
            items: {
                include: { product: true },
            },
        },
    })

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: normalizedUserId },
            include: {
                items: {
                    include: { product: true },
                },
            },
        })
    }

    return cart
}

// Obtener un carrito por id (uso pensado para admin/soporte/debugging, no para el flujo normal de usuario, que usa getCart por userId)
export const getCartById = async (cartId) => {
    let cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
            items: {
                include: { product: true },
            },
        },
    })
    return cart
}

// Añadir producto al carrito
export const addItem = async (userId, productId, quantity) => {
    const product = await prisma.product.findUnique({
        where: { id: productId }
    })

    if (!product) {
        const error = new Error("El producto no existe")
        error.statusCode = 404
        throw error
    }

    const cart = await getCart(userId)

    const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId },
    })

    const currentQuantityInCart = existingItem ? existingItem.quantity : 0
    const totalRequested = currentQuantityInCart + quantity

    if (totalRequested > product.stock) {
        const error = new Error(
            `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${totalRequested}`
        )
        error.statusCode = 400
        throw error
    }

    if (existingItem) {
        return prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
        })
    }

    return prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
    })
}

const assertItemBelongsToUser = async (itemId, userId) => {
    const item = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
    })

    if (!item) {
        const error = new Error("Elemento no encontrado en el carrito")
        error.statusCode = 404
        throw error
    }

    if (item.cart.userId !== String(userId)) {
        const error = new Error("No tienes permiso para modificar este carrito")
        error.statusCode = 403
        throw error
    }

    return item
}

export const removeItem = async (userId, itemId) => {
    await assertItemBelongsToUser(itemId, userId)

    return await prisma.cartItem.delete({
        where: { id: itemId },
    })
}

export const decreaseItemQuantity = async (userId, itemId, quantity) => {
    const item = await assertItemBelongsToUser(itemId, userId)

    const newQuantity = item.quantity - quantity

    if (newQuantity <= 0) {
        return prisma.cartItem.delete({
            where: { id: itemId },
        })
    }

    return prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
    })
}