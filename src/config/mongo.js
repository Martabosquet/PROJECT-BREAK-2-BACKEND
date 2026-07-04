import "dotenv/config"
import mongoose from "mongoose"

export const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Base de datos conectada correctamente")
    } catch (error) {
        console.error("Error al conectar", error)
        // Relanzamos el error para que el try/catch de server.js pueda
        // detener el arranque con process.exit.
        throw error
    }
}