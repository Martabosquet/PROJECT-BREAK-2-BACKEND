import prisma from "../config/prismaClient.js"
import stripe from "../config/stripe.js"

const STANDARD_SHIPPING_COST = 4.95

const getShippingCost = (population = "", subtotal = 0) =>
    population.trim().toLocaleLowerCase("es-ES") === "bakio" || Number(subtotal) > 50
        ? 0
        : STANDARD_SHIPPING_COST

// Calcula el total real del carrito activo del usuario (nunca nos fiamos de un
// total que mande el frontend) y crea un PaymentIntent en Stripe por ese importe.
export const createPaymentIntent = async (userId, shippingAddress) => {
    const cart = await prisma.cart.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { items: { include: { product: true } } },
    })

    if (!cart || !cart.items || cart.items.length === 0) {
        const error = new Error("El carrito está vacío")
        error.statusCode = 400
        throw error
    }

    let total = 0
    const snapshotItems = []
    for (const item of cart.items) {
        if (!item.product) {
            const error = new Error(`El producto con ID ${item.productId} ya no existe`)
            error.statusCode = 404
            throw error
        }
        // Comprobación "blanda" aquí: evita que alguien intente pagar algo sin stock.
        // La comprobación definitiva (y el descuento real) ocurre en el webhook.
        if (item.product.stock < item.quantity) {
            const error = new Error(`No hay suficiente stock para "${item.product.name}"`)
            error.statusCode = 400
            throw error
        }
        const price = Number(item.product.price)
        total += price * item.quantity
        snapshotItems.push({
            productId: item.product.id,
            name: item.product.name,
            price,
            quantity: item.quantity,
        })
    }

    const shippingCost = getShippingCost(shippingAddress.city, total)
    const totalWithShipping = total + shippingCost

    // Stripe trabaja en la unidad mínima de la moneda: céntimos para EUR. (12.50 € -> 1250)
    const amountInCents = Math.round(totalWithShipping * 100)

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        metadata: {
            userId: String(userId),
        },
        automatic_payment_methods: { enabled: true },
    })

    await prisma.paymentSnapshot.create({
        data: {
            paymentIntentId: paymentIntent.id,
            userId: String(userId),
            total: totalWithShipping,
            shippingAddress,
            items: snapshotItems,
        },
    })

    return {
        clientSecret: paymentIntent.client_secret,
    }
}