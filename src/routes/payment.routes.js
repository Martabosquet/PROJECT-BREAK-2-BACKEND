import express from "express"
import { authMiddleware } from "../middlewares/authenticate.js"
import { createPaymentIntent } from "../controllers/payment.controller.js"

const router = express.Router()

router.post("/api/checkout", authMiddleware, createPaymentIntent)

export default router