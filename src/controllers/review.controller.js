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

        // Estructuramos los datos de la review combinando el cuerpo de la petición (rating, comment)
        // con el userId extraído de la sesión (token JWT) y el productId de los parámetros
        const reviewData = {
            ...req.body,
            userId: String(req.user.id), // Normalizamos el ID de usuario a String
            productId,
        }

        // Guardamos la review en MongoDB a través del servicio correspondiente
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

        // 1. Obtener la review actual desde MongoDB para verificar quién la creó
        const existingReview = await reviewService.getReviewById(reviewId)
        if (!existingReview) {
            const error = new Error("Review no encontrada")
            error.statusCode = 404
            throw error
        }

        // 2. Comprobar si el usuario es el creador de la review o un admin
        if (existingReview.userId !== String(req.user.id) && req.user.role !== "admin") {
            const error = new Error("Acceso denegado. No tienes permisos para actualizar esta review.")
            error.statusCode = 403
            throw error
        }

        // 3. Proceder con la actualización pasándole el cuerpo de la petición (ej. nuevos rating/comment)
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

        // 1. Obtener la review actual para verificar la propiedad
        const existingReview = await reviewService.getReviewById(reviewId)
        if (!existingReview) {
            const error = new Error("Review no encontrada")
            error.statusCode = 404
            throw error
        }

        // 2. Comprobar si el usuario es el creador de la review o un admin
        if (existingReview.userId !== String(req.user.id) && req.user.role !== "admin") {
            const error = new Error("Acceso denegado. No tienes permisos para eliminar esta review.")
            error.statusCode = 403
            throw error
        }

        // 3. Proceder a eliminar de MongoDB usando el servicio
        await reviewService.deleteReview(reviewId)

        // Confirmamos al cliente la eliminación del recurso
        res.json({
            ok: true,
            message: "Review eliminada",
        })
    } catch (error) {
        next(error);
    }
}