import { Review } from "../models/review.model.js"

export const createReview = async (data) => {
    const review = new Review(data)
    return await review.save()
}

export const getReviewsByProduct = async (productId) => {
    return await Review.find({ productId })
}

export const getReviewById = async (id) => {
    return await Review.findById(id)
}

export const updateReview = async (id, data) => {
    return await Review.findByIdAndUpdate(id, data, { new: true })
}

export const deleteReview = async (id) => {
    return await Review.findByIdAndDelete(id)
}

// ==========================================
// FUNCIONES PURAS DE AUXILIO PARA TESTING
// Estas funciones no realizan accesos a base de datos y facilitan las pruebas unitarias.
// ==========================================

export const calculateAverage = (ratings) => {
    if (!ratings || ratings.length === 0) {
        return 0
    }

    const total = ratings.reduce((acc, rating) => acc + rating, 0)
    return total / ratings.length
}

// Filtrar reviews por rating

export const filterByMinRating = (reviews, minRating) => {
    return reviews.filter((review) => review.rating >= minRating)
}

// Crear una review válida

export const createReviewObject = (productId, userId, rating, comment = "") => {
    // Validación de campos requeridos
    if (!productId || !userId || !rating) {
        throw new Error("productId, userId y rating son obligatorios")
    }

    // Validación de rango comercial y técnico del rating
    if (rating < 1 || rating > 10) {
        throw new Error("El rating debe tener un valor entre 1 y 10")
    }

    // Devolvemos el objeto formateado con marca temporal ISO
    return {
        productId,
        userId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
    }
}

// Ordenar las reviews por rating (ascendente o descendente)

export const sortReviews = (reviews, order = "desc") => {
    // Clonamos el array original con [...reviews] para evitar mutar el original (función pura)
    // y aplicamos el método sort en función del sentido indicado
    return [...reviews].sort((a, b) =>
        order === "asc" ? a.rating - b.rating : b.rating - a.rating,
    )
}