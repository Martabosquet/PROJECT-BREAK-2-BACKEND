import express from "express"
import * as reviewController from "../controllers/reviewController.js"

const router = express.Router()

router.post("/reviews", reviewController.createReview)
router.get("/reviews/movie/:movieId", reviewController.getReviewsByMovie)
router.put("/reviews/:id", reviewController.updateReview)
router.delete("/reviews/:id", reviewController.deleteReview)

export default router