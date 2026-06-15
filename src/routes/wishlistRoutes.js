import express from "express"
import * as wishlistController from "../controllers/wishlistController.js"

const router = express.Router()

router.post("/wishlist", wishlistController.addToWishlist)
router.get("/wishlist/user/:userId", wishlistController.getWishlistByUser)
router.delete("/wishlist/:id", wishlistController.removeFromWishlist)

export default router