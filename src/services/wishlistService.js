import { Wishlist } from "../models/wishlist.model.js"

export const addToWishlist = async (userId, movieId) => {
    const wishlist = new Wishlist({ userId, movieId })
    return await wishlist.save()
}

export const getWishlistByUser = async (userId) => {
    return await Wishlist.find({ userId })
}

export const removeFromWishlist = async (id) => {
    return await Wishlist.findByIdAndDelete(id)
}

// Funciones puras para test

// Añade una película a la lista. No añade duplicados

export const addMovieToWishlist = (list, movieId) => {
    // comprobamos que la película existe dentro de la lista para evitar duplicados

    if (list.includes(movieId)) {
        return list
    }

    return [...list, movieId] // si no está, creamos nuevo array clonando la lista y añadiendo la nueva película
}

// Elimina una película de la lista

export const removeMovieFromWishlist = (list, movieId) => {
    return list.filter((id) => id !== movieId)
}

// Comprueba si una película está en la lista

export const isMovieInWishlist = (list, movieId) => {
    return list.includes(movieId) // devuelve true o false
}