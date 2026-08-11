import * as orderService from "../services/order.service.js"

// export const createOrder = async (req, res, next) => {
//     try {
//         const userId = String(req.user.id);
//         const { shippingAddress } = req.body;

//         if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
//             const error = new Error("Todos los campos de la dirección de envío son obligatorios");
//             error.statusCode = 400;
//             throw error;
//         }

//         const newOrder = await orderService.createOrder(userId, shippingAddress);

//         res.status(201).json({
//             ok: true,
//             message: "Pedido creado con éxito y stock actualizado",
//             data: newOrder,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// Obtener el historial de pedidos del usuario
export const getUserOrders = async (req, res, next) => {
    try {
        const userId = String(req.user.id);

        const orders = await orderService.getUserOrders(userId);

        res.json({
            ok: true,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

// Usado por la página de éxito para comprobar si el webhook ya procesó el
// pago y creó el pedido. Puede devolver 404 legítimamente mientras el
// webhook todavía no ha llegado — el frontend reintenta en ese caso.
export const getOrderByPaymentIntent = async (req, res, next) => {
    try {
        const userId = String(req.user.id);
        const { paymentIntentId } = req.params;

        const order = await orderService.getOrderByPaymentIntentId(userId, paymentIntentId);

        if (!order) {
            const error = new Error("Pedido no encontrado todavía");
            error.statusCode = 404;
            throw error;
        }

        res.json({ ok: true, data: order });
    } catch (error) {
        next(error);
    }
};