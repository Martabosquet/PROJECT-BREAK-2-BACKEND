import prisma from "../config/prismaClient.js"
import stripe from "../config/stripe.js"

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
        total += Number(item.product.price) * item.quantity
    }

    // Stripe trabaja en la unidad mínima de la moneda: céntimos para EUR.
    // 12.50 € -> 1250. Si no conviertes, cobrarías 100 veces menos de lo esperado.
    const amountInCents = Math.round(total * 100)

    // Guardamos en metadata todo lo que el webhook va a necesitar para crear el
    // pedido después, porque el webhook NO tiene acceso a req.user ni a req.body.
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        metadata: {
            userId: String(userId),
            street: shippingAddress.street,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
        },
        automatic_payment_methods: { enabled: true },
    })

    return {
        clientSecret: paymentIntent.client_secret,
    }
}