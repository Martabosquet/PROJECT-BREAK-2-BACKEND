//REVIEWS: Crear reviews, obtener reviews, actualizar review y borrar review

import express from "express"
import * as reviewController from "../controllers/review.controller.js"
import { authMiddleware } from "../middlewares/authenticate.js"
import { requireRole } from "../middlewares/requireRole.js"

const router = express.Router()

// Rutas de reviews ligadas a productos
router.get("/api/products/:productId/reviews", reviewController.getReviewsByProduct)
router.post("/api/products/:productId/reviews", authMiddleware, reviewController.createReview)

// Rutas administrativas adicionales que requieren autenticación y rol de admin
router.put("/api/reviews/:id", authMiddleware, requireRole("admin"), reviewController.updateReview)
router.delete("/api/reviews/:id", authMiddleware, requireRole("admin"), reviewController.deleteReview)
router.get('/api/admin/reviews', authMiddleware, requireRole("admin"), reviewController.getAllReviewsForAdmin);
router.delete('/api/admin/reviews/:id', authMiddleware, requireRole("admin"), reviewController.deleteReview);

export default router