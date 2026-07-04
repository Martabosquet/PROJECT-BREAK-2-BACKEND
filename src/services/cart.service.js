import prisma from "../config/prismaClient.js"

// Obtenemos el carrito active del user y si no existe lo crea
export const getCart = async (userId) => {
    const normalizedUserId = String(userId)
    let cart = await prisma.cart.findFirst({
        where: { userId: normalizedUserId, status: "ACTIVE" },
        include: { items: true },
    })

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

    // validamos el stock disponible antes de añadir/acumular cantidad en el carrito. Ahora comprobamos que la cantidad total
    // solicitada (lo que ya había en el carrito + lo nuevo) no supere el stock real del producto.
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

// Comprobamos que el item pertenece al carrito del usuario que hace la petición. Evita que un usuario autenticado pueda borrar/modificar
// items de carritos ajenos adivinando o reutilizando un itemId (IDOR).
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
    // comprobamos por itemId que perteneciera al carrito del usuario autenticado (IDOR).
    await assertItemBelongsToUser(itemId, userId)

    return await prisma.cartItem.delete({
        where: { id: itemId },
    })
}

// Disminuir la cantidad de un item del carrito
export const decreaseItemQuantity = async (userId, itemId, quantity) => {
    // misma comprobación de propiedad que en removeItem.
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

            // comprobamos que haya stock suficiente en el momento del checkout (el stock puede haber cambiado desde
            // que se añadió al carrito), y se descuenta del stock tras confirmar la compra.
            if (product.stock < item.quantity) {
                const error = new Error(
                    `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}`
                )
                error.statusCode = 400
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

    // Usamos una transacción para que la creación del pedido, el descuento de stock y el cierre del carrito sean atómicos: si algo
    // falla a mitad de camino, no queremos stock descontado sin pedido creado (o viceversa).
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId: normalizedUserId,
                total: totalValue,
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: true,
            },
        })

        // descontamos el stock de cada producto comprado
        for (const item of itemsData) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
            })
        }

        await tx.cart.update({
            where: { id: cart.id },
            data: { status: "CHECKED_OUT" },
        })

        return newOrder
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