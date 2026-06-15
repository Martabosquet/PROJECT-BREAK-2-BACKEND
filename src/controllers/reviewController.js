import * as reviewService from "../services/reviewService.js"

export const createReview = async (req, res) => {
    try {
        const review = await reviewService.createReview(req.body)
        res.status(201).json({
            ok: true,
            data: review,
        })
    } catch (error) {
        res.status(400).json({
            ok: false,
            error: error.message,
        })
    }
}

export const getReviewsByMovie = async (req, res) => {
    try {
        const reviews = await reviewService.getReviewsByMovie(req.params.movieId)
        res.json({
            ok: true,
            data: reviews,
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
        })
    }
}

export const updateReview = async (req, res) => {
    try {
        const review = await reviewService.updateReview(req.params.id, req.body)

        if (!review) {
            return res.status(404).json({
                ok: false,
                error: "Review no encontrada",
            })
        }

        res.json({
            ok: true,
            data: review,
        })
    } catch (error) {
        res.status(400).json({
            ok: false,
            error: error.message,
        })
    }
}

export const deleteReview = async (req, res) => {
    try {
        const review = await reviewService.deleteReview(req.params.id)

        if (!review) {
            return res.status(404).json({
                ok: false,
                error: "Review no encontrada",
            })
        }

        res.json({
            ok: true,
            message: "Review eliminada",
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
        })
    }
}