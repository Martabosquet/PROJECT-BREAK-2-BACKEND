import stripe from "../config/stripe.js"
import prisma from "../config/prismaClient.js"
import * as orderService from "../services/order.service.js"
import { sendOrderConfirmationEmail } from "../services/email.service.js"

export const stripeWebhookController = async (req, res) => {
    const signature = req.headers['stripe-signature']

    let event

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.error('Firma del webhook inválida:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object
        try {
            // Verificación de idempotencia: evitar duplicados si Stripe reintenta el evento
            const existingOrder = await prisma.order.findFirst({
                where: { stripePaymentIntentId: paymentIntent.id },
            })

            if (existingOrder) {
                console.log(`⚠️ Pedido ya registrado previamente para el paymentIntent ${paymentIntent.id}.`)
                return res.json({ received: true })
            }

            const snapshot = await prisma.paymentSnapshot.findUnique({
                where: { paymentIntentId: paymentIntent.id },
            })

            if (!snapshot) {
                throw new Error(`No existe snapshot para el paymentIntent ${paymentIntent.id}`)
            }

            if (Math.round(Number(snapshot.total) * 100) !== paymentIntent.amount) {
                throw new Error(`El importe del paymentIntent ${paymentIntent.id} no coincide con el snapshot`)
            }

            const order = await orderService.createOrder(
                snapshot.userId,
                snapshot.shippingAddress,
                paymentIntent.id,
                snapshot
            )

            const user = await prisma.user.findUnique({
                where: { id: Number(snapshot.userId) },
                select: { email: true, name: true },
            })

            if (user?.email) {
                sendOrderConfirmationEmail(order, user.email, user.name)
                    .catch((err) => console.error('Error enviando email (async):', err))
            }
        } catch (error) {
            console.error('Error creando el pedido desde el webhook:', error)
            return res.status(500).json({ received: false })
        }
    }

    // Confirmamos a Stripe que hemos recibido y procesado el evento correctamente.
    res.json({ received: true })
}