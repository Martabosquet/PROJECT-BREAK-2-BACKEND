import "dotenv/config"
import mongoose from "mongoose"

export const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Base de datos conectada correctamente")
    } catch (error) {
        console.error("Error al conectar", error)
        throw error
    }
}