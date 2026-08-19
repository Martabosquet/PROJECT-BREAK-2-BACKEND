import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

// Ruta para procesar el pago y crear el pedido (vaciando el carrito)
// router.post("/api/orders", authMiddleware, orderController.createOrder);

// Ruta para listar los pedidos del usuario
router.get("/api/orders", authMiddleware, orderController.getUserOrders);
router.get("/api/orders/by-payment-intent/:paymentIntentId", authMiddleware, orderController.getOrderByPaymentIntent);

// Rutas exclusivas de administración
router.get("/api/admin/orders", authMiddleware, requireRole("admin"), orderController.getAllOrders);
router.patch("/api/admin/orders/:orderId/status", authMiddleware, requireRole("admin"), orderController.updateOrderStatus);

export default router;