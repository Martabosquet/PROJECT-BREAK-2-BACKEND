import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/authenticate.js";

const router = express.Router();

// Ruta para procesar el pago y crear el pedido (vaciando el carrito)
// router.post("/api/orders", authMiddleware, orderController.createOrder);

// Ruta para listar los pedidos del usuario
router.get("/api/orders", authMiddleware, orderController.getUserOrders);
router.get("/api/orders/by-payment-intent/:paymentIntentId", authMiddleware, orderController.getOrderByPaymentIntent);

export default router;