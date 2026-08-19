import prisma from "../config/prismaClient.js"

const isUniqueConstraintOnPaymentIntent = (error) => {
    return error?.code === "P2002" && error?.meta?.modelName === "Order"
}

export const createOrder = async (userId, shippingAddress, paymentIntentId) => {
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
        where: {
            userId,
            status: 'ACTIVE'
        },
        include: {
            items: {
                include: { product: true }
            }
        }
    });

    if (!cart || !cart.items || cart.items.length === 0) {
        const error = new Error("El carrito está vacío");
        error.statusCode = 400;
        throw error;
    }

    let calculatedTotal = 0;
    const orderItemsData = [];

    for (const cartItem of cart.items) {
        const product = cartItem.product || await prisma.product.findUnique({
            where: { id: cartItem.productId }
        });

        if (!product) {
            const error = new Error(`El producto con ID ${cartItem.productId} ya no existe`);
            error.statusCode = 404;
            throw error;
        }

        const price = Number(product.price);
        const quantity = Number(cartItem.quantity);

        if (product.stock < quantity) {
            const error = new Error(`No hay suficiente stock para la película: ${product.name}`);
            error.statusCode = 400;
            throw error;
        }

        calculatedTotal += price * quantity;

        orderItemsData.push({
            productId: product.id,
            quantity: quantity,
            priceAtPurchase: price,
        });
    }

    try {
        const newOrder = await prisma.$transaction(async (tx) => {
            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

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

            await tx.cart.update({
                where: { id: cart.id },
                data: { status: 'CHECKED_OUT' }
            });

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

export const getUserOrders = async (userId) => {
    return prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
    });
};

export const getOrderByPaymentIntentId = async (userId, paymentIntentId) => {
    return prisma.order.findFirst({
        where: {
            stripePaymentIntentId: paymentIntentId,
            userId,
        },
        include: { items: true },
    })
}