import prisma from "../config/prismaClient.js"

export const createOrder = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        const { shippingAddress } = req.body;

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
            const error = new Error("Todos los campos de la dirección de envío son obligatorios");
            error.statusCode = 400;
            throw error;
        }

        // 1. Buscamos el carrito activo del usuario
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

        // 2. Verificamos stock disponible y preparamos los datos
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

            // Opcional pero recomendado: Comprobar si hay stock suficiente antes de comprar
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

        // 3. Transacción en Prisma: Creamos la orden, descontamos stock y actualizamos el carrito
        const newOrder = await prisma.$transaction(async (tx) => {
            // A. Descontar el stock de cada película comprada
            for (const item of cart.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity, // Resta la cantidad comprada al stock actual
                        },
                    },
                });
            }

            // B. Creamos la orden
            const order = await tx.order.create({
                data: {
                    userId,
                    total: calculatedTotal,
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    postalCode: shippingAddress.postalCode,
                    country: shippingAddress.country,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: true,
                },
            });

            // C. Actualizamos el carrito a CHECKED_OUT
            await tx.cart.update({
                where: { id: cart.id },
                data: { status: 'CHECKED_OUT' }
            });

            return order;
        });

        res.status(201).json({
            ok: true,
            message: "Pedido creado con éxito y stock actualizado",
            data: newOrder,
        });

    } catch (error) {
        next(error);
    }
};

// Obtener el historial de pedidos del usuario
export const getUserOrders = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        
        const orders = await prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            ok: true,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};