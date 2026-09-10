import prisma from "../config/prismaClient.js"

const isUniqueConstraintOnPaymentIntent = (error) => {
    return error?.code === "P2002" && error?.meta?.modelName === "Order"
}

export const createOrder = async (rawUserId, shippingAddress, paymentIntentId, snapshot = null) => {
    const userId = String(rawUserId);

    if (paymentIntentId) {
        const existingOrder = await prisma.order.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
            include: { items: { include: { product: true } } },
        })
        if (existingOrder) {
            return existingOrder
        }
    }

    const cart = await prisma.cart.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { items: { include: { product: true } } },
    });

    const sourceItems = snapshot?.items ?? cart?.items ?? [];
    if (sourceItems.length === 0) {
        const error = new Error("El carrito está vacío");
        error.statusCode = 400;
        throw error;
    }

    let calculatedTotal = snapshot ? Number(snapshot.total) : 0;
    const orderItemsData = [];

    for (const cartItem of sourceItems) {
        const productId = cartItem.productId;
        const product = cartItem.product || await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            const error = new Error(`El producto con ID ${cartItem.productId} ya no existe`);
            error.statusCode = 404;
            throw error;
        }

        const price = snapshot ? Number(cartItem.price) : Number(product.price);
        const quantity = Number(cartItem.quantity);

        if (!snapshot) calculatedTotal += price * quantity;

        orderItemsData.push({
            productId,
            quantity: quantity,
            priceAtPurchase: price,
        });
    }

    try {
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Descontar stock
            for (const item of sourceItems) {
                const updated = await tx.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });
                if (updated.count !== 1) {
                    const error = new Error(`No hay suficiente stock para el producto ${item.productId}`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            // 2. Crear la orden con sus items
            const order = await tx.order.create({
                data: {
                    userId,
                    total: calculatedTotal,
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    postalCode: shippingAddress.postalCode,
                    country: shippingAddress.country,
                    stripePaymentIntentId: paymentIntentId,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: {
                        include: { product: true },
                    },
                },
            });

            // 3. Marcar el carrito como procesado
            if (cart) {
                await tx.cart.update({
                    where: { id: cart.id },
                    data: { status: 'CHECKED_OUT' }
                });
            }

            return order;
        });

        return newOrder;

    } catch (error) {
        if (isUniqueConstraintOnPaymentIntent(error)) {
            const existingOrder = await prisma.order.findUnique({
                where: { stripePaymentIntentId: paymentIntentId },
                include: { items: { include: { product: true } } },
            });

            if (existingOrder) {
                return existingOrder;
            }
        }

        throw error;
    }
};

export const getUserOrders = async (rawUserId) => {
    const userId = String(rawUserId);
    return prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

export const getOrderByPaymentIntentId = async (rawUserId, paymentIntentId) => {
    const userId = String(rawUserId);
    return prisma.order.findFirst({
        where: {
            stripePaymentIntentId: paymentIntentId,
            userId,
        },
        include: { items: { include: { product: true } } },
    })
}

export const getAllOrders = async () => {
    return prisma.order.findMany({
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

const VALID_STATUSES = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export const updateOrderStatus = async (orderId, status) => {
    if (!VALID_STATUSES.includes(status)) {
        const error = new Error(`Estado inválido. Debe ser uno de: ${VALID_STATUSES.join(", ")}`);
        error.statusCode = 400;
        throw error;
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
        const error = new Error("Pedido no encontrado");
        error.statusCode = 404;
        throw error;
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: { items: { include: { product: true } } },
    });
};