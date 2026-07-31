import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    userName: {  // 👈 Añadimos este campo
        type: String,
        required: true,
        default: "Usuario Anónimo"
    },
    productId: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
    },
    comment: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    fechaDeVisualizacion: {
        type: String,
    },
})

export const Review = mongoose.model("Review", reviewSchema)