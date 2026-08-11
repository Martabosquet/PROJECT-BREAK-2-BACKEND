import * as paymentService from "../services/payment.service.js"

export const createPaymentIntent = async (req, res, next) => {
    try {
        const userId = String(req.user.id)
        const { shippingAddress } = req.body

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
            const error = new Error("Todos los campos de la dirección de envío son obligatorios")
            error.statusCode = 400
            throw error
        }

        const result = await paymentService.createPaymentIntent(userId, shippingAddress)

        res.json({
            ok: true,
            data: result,
        })
    } catch (error) {
        next(error)
    }
}