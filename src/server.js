//SERVER SOLO ARRANCA EL SERVIDOR, NO TIENE RUTAS, SOLO SE ENCARGA DE ARRANCAR EL SERVIDOR Y DE GESTIONAR LOS ERRORES 404

import "dotenv/config"
import app from "./app.js"
import { dbConnection } from "./db/database.js"

const PORT = process.env.PORT || 3000

app.use((req, res) => {
    res.status(404).json({
        ok: false,
        message: "Error 404: La ruta solicitada no existe",
        data: null
    });
});

try {
    await dbConnection()
    app.listen(PORT, () => {
        console.log(`🔐 Server is running on http://localhost:${PORT}`)
    })
} catch (error) {
    console.error("Error al conectar con MongoDB", error.message)
    process.exit(1)
}