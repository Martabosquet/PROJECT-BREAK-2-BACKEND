//REVIEWS: Crear reviews, obtener reviews, actualizar review y borrar review

import express from "express"
import * as reviewController from "../controllers/review.controller.js"
import { authMiddleware } from "../middlewares/authenticate.js"
import { requireRole } from "../middlewares/requireRole.js"

const router = express.Router()

// Rutas de reviews para usuarios autenticados
router.get("/api/products/:productId/reviews", reviewController.getReviewsByProduct)
router.post("/api/products/:productId/reviews", authMiddleware, reviewController.createReview)
router.get("/api/users/me/reviews", authMiddleware, reviewController.getMyReviews);
router.delete('/api/reviews/:id', authMiddleware, reviewController.deleteReview); //solo podrá borrar cada uno la suya, salvo admin que puede todas

// Rutas administrativas adicionales que requieren autenticación y rol de admin
router.put("/api/reviews/:id", authMiddleware, requireRole("admin"), reviewController.updateReview)
router.get('/api/admin/reviews', authMiddleware, requireRole("admin"), reviewController.getAllReviewsForAdmin);


export default router