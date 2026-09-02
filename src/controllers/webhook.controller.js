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
        const { userId, street, city, postalCode, country } = paymentIntent.metadata

        try {
            const order = await orderService.createOrder(
                userId,
                { street, city, postalCode, country },
                paymentIntent.id
            )

            const user = await prisma.user.findUnique({
                where: { id: Number(userId) },
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

    // Confirmamos a Stripe que hemos recibido y procesado el evento.
    // Si no respondes 2xx, Stripe seguirá reintentando este mismo evento.
    res.json({ received: true })
}