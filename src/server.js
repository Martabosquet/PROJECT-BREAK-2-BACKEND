//SERVER SOLO ARRANCA EL SERVIDOR, NO TIENE RUTAS, SOLO SE ENCARGA DE ARRANCAR EL SERVIDOR Y DE GESTIONAR LOS ERRORES 404

import app from './app.js';

const PORT = process.env.PORT || 3000 // coge el puerto del .env y si no coge el 3000

// PUNTO 5: Manejador final para rutas inexistentes (404), hay que ponerlo al final de las rutas, pero antes del arranque del servidor, para que se ejecute si no se encuentra ninguna ruta definida anteriormente
app.use((req, res) => {
    res.status(404).json({
        ok: false,
        message: "Error 404: La ruta solicitada no existe",
        data: null
    });
});

// PUNTO 3: CREAR EL ARRANQUE DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`🔐 Auth API corriendo en http://localhost:${PORT}`)
    console.log(`POST /login  |  POST /logout  |  GET /profile  |  GET /admin`)
});