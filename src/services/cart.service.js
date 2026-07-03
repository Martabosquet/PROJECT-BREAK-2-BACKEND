import prisma from "../config/prismaClient.js"

// Obtenemos el carrito active del user y si no existe lo crea
export const getCart = async (userId) => {
    // Normalizamos el ID del usuario a String ya que en la base de datos se guarda en este formato
    const normalizedUserId = String(userId)

    // Buscamos en PostgreSQL el primer carrito que pertenezca al usuario y cuyo estado sea ACTIVE
    let cart = await prisma.cart.findFirst({
        where: { userId: normalizedUserId, status: "ACTIVE" },
        include: { items: true },
    })

    // Si no existe un carrito activo previo, creamos uno nuevo para iniciar la sesión de compra
    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: normalizedUserId },
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
    // Validación: Verificar que el producto existe en la BD
    const product = await prisma.product.findUnique({
        where: { id: productId }
    })

    if (!product) {
        const error = new Error("El producto no existe")
        error.statusCode = 404
        throw error
    }

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

// Eliminar un producto del carrito por su itemId
export const removeItem = async (itemId) => {
    return await prisma.cartItem.delete({
        where: { id: itemId },
    })
}

// Disminuir la cantidad de un item del carrito
export const decreaseItemQuantity = async (itemId, quantity) => {
    const item = await prisma.cartItem.findUnique({
        where: { id: itemId },
    })

    if (!item) return null

    const newQuantity = item.quantity - quantity

    // Si la cantidad llega a cero o menos, eliminamos el producto del carrito
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

export const checkout = async (userId) => {
    const normalizedUserId = String(userId)

    const cart = await prisma.cart.findFirst({
        where: { userId: normalizedUserId, status: "ACTIVE" },
        include: { items: true },
    })

    if (!cart) {
        const error = new Error("No hay carrito activo")
        error.statusCode = 404
        throw error
    }

    // Si el carrito existe pero no tiene ningún producto, denegamos el checkout
    if (cart.items.length === 0) {
        const error = new Error("El carrito está vacío")
        error.statusCode = 400
        throw error
    }

    // Cargamos y cruzamos los precios actuales de los productos en la base de datos.
    // Esto previene fraude en el que se envíen precios alterados desde el cliente.
    const itemsData = await Promise.all(
        cart.items.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })

            if (!product) {
                const error = new Error(`Producto con id ${item.productId} no encontrado`)
                error.statusCode = 404
                throw error
            }

            return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: product.price,
            }
        }),
    )

    const totalValue = itemsData.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0,
    )

    // Creamos el registro del pedido (Order) e insertamos sus líneas asociadas (OrderItem)
    const order = await prisma.order.create({
        data: {
            userId: normalizedUserId,
            total: totalValue,
            items: {
                create: itemsData,
            },
        },
        include: {
            items: true, // Retornamos el pedido incluyendo el desglose de ítems
        },
    })

    await prisma.cart.update({
        where: { id: cart.id },
        data: { status: "CHECKED_OUT" },
    })

    return order
}

export const getOrdersByUser = async (userId) => {
    const normalizedUserId = String(userId)

    return await prisma.order.findMany({
        where: { userId: normalizedUserId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
    })
}

export const getOrderById = async (userId, orderId) => {
    const normalizedUserId = String(userId)

    return await prisma.order.findFirst({
        where: { id: orderId, userId: normalizedUserId },
        include: { items: true },
    })
}
