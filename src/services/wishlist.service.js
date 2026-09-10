import { Wishlist } from "../models/wishlist.model.js"
import prisma from "../config/prismaClient.js"

export const addToWishlist = async (userId, productId) => {
    // Validación cruzada de BD: Consultamos en PostgreSQL (vía Prisma) que el producto exista
    const productExists = await prisma.product.findUnique({
        where: { id: productId }
    })

    if (!productExists) {
        const error = new Error("El producto no existe")
        error.statusCode = 404
        throw error
    }

    // Persistencia en MongoDB: Si existe, creamos un documento en la wishlist de MongoDB
    const wishlist = new Wishlist({ userId, productId })
    return await wishlist.save()
}

export const getWishlistByUser = async (userId) => {
    return await Wishlist.find({ userId })
}

export const removeFromWishlist = async (id) => {
    // Ejecuta la consulta de eliminación por clave primaria _id en MongoDB
    return await Wishlist.findByIdAndDelete(id)
}

// ==========================================
// FUNCIONES PURAS AUXILIARES PARA TESTING
// Operaciones puras en memoria sobre listas (arrays) para testeo unitario.
// ==========================================

export const addProductToWishlist = (list, productId) => {
    // Comprobamos si el producto ya existe en la lista para evitar duplicar favoritos
    if (list.includes(productId)) {
        return list
    }

    // Retornamos un nuevo array clonando la lista previa y concatenando el nuevo elemento (inmutabilidad)
    return [...list, productId]
}

export const removeProductFromWishlist = (list, productId) => {
    return list.filter((id) => id !== productId)
}

export const isProductInWishlist = (list, productId) => {
    return list.includes(productId)
}

export const toggleWishlist = async (userId, productId) => {
    const productExists = await prisma.product.findUnique({ where: { id: productId } })
    if (!productExists) {
        const error = new Error("El producto no existe")
        error.statusCode = 404
        throw error
    }

    const existing = await Wishlist.findOne({ userId, productId })
    if (existing) {
        await Wishlist.deleteOne({ _id: existing._id })
        return { action: "removed" }
    }

    const item = await Wishlist.create({ userId, productId })
    return { action: "added", item }
}

export const removeWishlistItem = async (userId, targetId) => {
    const query = { userId, $or: [{ productId: targetId }] }
    if (targetId.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: targetId })
    }
    return Wishlist.findOneAndDelete(query)
}