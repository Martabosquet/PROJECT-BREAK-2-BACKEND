import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    productId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// 🟢 Creamos un índice compuesto único para evitar que se repita la combinación de usuario y producto
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);