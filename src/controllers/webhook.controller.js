import stripe from "../config/stripe.js"
import * as orderService from "../services/order.service.js"

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
            await orderService.createOrder(
                userId,
                { street, city, postalCode, country },
                paymentIntent.id
            )
        } catch (error) {
            console.error('Error creando el pedido desde el webhook:', error)
            // Devolvemos 500 para que Stripe reintente este webhook más tarde
            return res.status(500).json({ received: false })
        }
    }

    // Confirmamos a Stripe que hemos recibido y procesado el evento.
    // Si no respondes 2xx, Stripe seguirá reintentando este mismo evento.
    res.json({ received: true })
}