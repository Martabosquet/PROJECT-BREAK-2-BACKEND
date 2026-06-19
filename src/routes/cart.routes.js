import express from "express"
import { authMiddleware } from "../middlewares/authenticate.js"
import {
    getCartController,
    getCartByIdController,
    addItemController,
    checkoutController,
} from "../controllers/cart.controller.js"

const router = express.Router()

router.get("/", authMiddleware, getCartController)
router.get("/:cartId", authMiddleware, getCartByIdController)
router.post("/items", authMiddleware, addItemController)
router.post("/checkout", authMiddleware, checkoutController)

export default router