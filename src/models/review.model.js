import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
    movieId: {
        type: String,
        required: true,
    },
    userId: {
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