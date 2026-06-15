import { Review } from "../models/review.model.js"

export const createReview = async (data) => {
    const review = new Review(data)
    return await review.save()
}

export const getReviewsByMovie = async (movieId) => {
    return await Review.find({ movieId })
}

export const updateReview = async (id, data) => {
    return await Review.findByIdAndUpdate(id, data, { new: true })
}

export const deleteReview = async (id) => {
    return await Review.findByIdAndDelete(id)
}

// Funciones puras de testeo

// Calcular la media de un array de ratings

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

export const createReviewObject = (movieId, userId, rating, comment = "") => {
    if (!movieId || !userId || !rating) {
        throw new Error("movieId, userId y rating son obligatorios")
    }

    if (rating < 1 || rating > 10) {
        throw new Error("El rating debe tener un valor entre 1 y 10")
    }

    return {
        movieId,
        userId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
    }
}

// Ordenar las reviews por rating (ascendente o descendente)

export const sortReviews = (reviews, order = "desc") => {
    return [...reviews].sort((a, b) =>
        order === "asc" ? a.rating - b.rating : b.rating - a.rating,
    )
}