import * as reviewService from "../services/review.service.js"

export const createReview = async (req, res, next) => {
    try {
        const { productId } = req.params

        // Validación básica: aseguramos que el ID del producto esté presente en la URL
        if (!productId) {
            const error = new Error("El productId es obligatorio en la URL")
            error.statusCode = 400
            throw error
        }

        const reviewData = {
            ...req.body,
            userId: String(req.user.id), // Normalizamos el ID de usuario a String
            productId,
        }

        const review = await reviewService.createReview(reviewData)
        res.status(201).json({
            ok: true,
            data: review,
        })
    } catch (error) {
        next(error);
    }
}

export const getReviewsByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params
        // Buscamos todas las reviews asociadas en la BD de MongoDB
        const reviews = await reviewService.getReviewsByProduct(productId)
        res.json({
            ok: true,
            data: reviews,
        })
    } catch (error) {
        next(error);
    }
}

export const updateReview = async (req, res, next) => {
    try {
        // Capturamos el identificador de la review
        const reviewId = req.params.id

        // Obtener la review actual desde MongoDB para verificar quién la creó
        const existingReview = await reviewService.getReviewById(reviewId)
        if (!existingReview) {
            const error = new Error("Review no encontrada")
            error.statusCode = 404
            throw error
        }

        // Comprobar si el usuario es el creador de la review o un admin
        if (existingReview.userId !== String(req.user.id) && req.user.role !== "admin") {
            const error = new Error("Acceso denegado. No tienes permisos para actualizar esta review.")
            error.statusCode = 403
            throw error
        }

        // Proceder con la actualización pasándole el cuerpo de la petición 
        const review = await reviewService.updateReview(reviewId, req.body)

        // Devolvemos la review modificada al cliente
        res.json({
            ok: true,
            data: review,
        })
    } catch (error) {
        next(error);
    }
}

export const deleteReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id

        const existingReview = await reviewService.getReviewById(reviewId)
        if (!existingReview) {
            const error = new Error("Review no encontrada")
            error.statusCode = 404
            throw error
        }

        if (existingReview.userId !== String(req.user.id) && req.user.role !== "admin") {
            const error = new Error("Acceso denegado. No tienes permisos para eliminar esta review.")
            error.statusCode = 403
            throw error
        }

        await reviewService.deleteReview(reviewId)

        res.json({
            ok: true,
            message: "Review eliminada",
        })
    } catch (error) {
        next(error);
    }
}