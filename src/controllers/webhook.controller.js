import stripe from "../config/stripe.js"
import prisma from "../config/prismaClient.js"                         // 👈 nuevo
import * as orderService from "../services/order.service.js"
import { sendOrderConfirmationEmail } from "../services/email.service.js"  // 👈 nuevo

export const stripeWebhookController = async (req, res) => {
    const signature = req.headers['stripe-signature']

    let event

    try {
        // req.body debe llegar aquí como Buffer sin parsear (ver el aviso
        // sobre app.js más abajo) — Stripe firma el cuerpo EXACTO que envió,
        // y si Express ya lo hubiera convertido a JSON, la firma no coincidiría.
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
                // No esperamos (await) a que el email termine de enviarse:
                // así respondemos a Stripe cuanto antes, reduciendo el riesgo
                // de que interprete la tardanza como un fallo y reintente.
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