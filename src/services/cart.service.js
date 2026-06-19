import prisma from "../config/prismaClient.js"

// Obtenemos el carrito active del user y si no existe lo crea
export const getCart = async (userId) => {
    let cart = await prisma.cart.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { items: true },
    })

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: { items: true },
        })
    }

    return cart
}

// Obtener un carrito por id

export const getCartById = async (cartId) => {
    let cart = await prisma.cart.findUnique({
        where: { id: cartId },
    })

    return cart
}

// Añadir producto al carrito

export const addItem = async (userId, productId, quantity) => {
    const cart = await getCart(userId)

    // comprobamos que existe el producto en el carrito
    const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId },
    })

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

export const checkout = async (userId) => {
    const cart = await prisma.cart.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { items: true },
    })

    if (!cart) {
        throw new Error("No hay carrito activo")
    }

    if (cart.items.length === 0) {
        throw new Error("El carrito está vacío")
    }

    let total = 0

    for (const item of cart.items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
        })

        total += product.price * item.quantity
    }

    const order = await prisma.order.create({
        data: { userId, total },
    })

    await prisma.cart.update({
        where: { id: cart.id },
        data: { status: "CHECKED_OUT" },
    })

    return order
}