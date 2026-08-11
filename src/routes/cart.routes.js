import express from "express"
import { authMiddleware } from "../middlewares/authenticate.js"
import { requireRole } from "../middlewares/requireRole.js"
import {
    getCartController,
    getCartByIdController,
    addItemController,
    removeItemController,
    decreaseItemQuantityController,
} from "../controllers/cart.controller.js"

const router = express.Router()

// Todas las rutas del carrito son privadas (requieren estar autenticado)
router.get("/api/cart", authMiddleware, getCartController)
router.post("/api/cart/items", authMiddleware, addItemController)
router.delete("/api/cart/items/:itemId", authMiddleware, removeItemController)
router.patch("/api/cart/items/:itemId", authMiddleware, decreaseItemQuantityController)

// Solo administradores: consultar cualquier carrito por su id (soporte/debugging)
router.get("/api/carts/:cartId", authMiddleware, requireRole("admin"), getCartByIdController)

export default router