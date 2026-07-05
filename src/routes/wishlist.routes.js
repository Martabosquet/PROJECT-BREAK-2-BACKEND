// LISTA DE DESEOS: Ver lista de deseos para el usuario, añadir productos a la lista de deseos y eliminar productos de la lista de deseos

import express from "express"
import * as wishlistController from "../controllers/wishlist.controller.js"
import { authMiddleware } from "../middlewares/authenticate.js"
import { requireRole } from "../middlewares/requireRole.js"

const router = express.Router()

// Todas las rutas de wishlist son privadas (requieren estar autenticado) y la de borrar requiere ser admin, ya que es una acción administrativa
router.get("/api/wishlist", authMiddleware, wishlistController.getWishlistByUser)
router.post("/api/wishlist/:productId", authMiddleware, wishlistController.addToWishlist)
router.delete("/api/wishlist/:id", authMiddleware, requireRole("admin"), wishlistController.removeFromWishlist)

export default router