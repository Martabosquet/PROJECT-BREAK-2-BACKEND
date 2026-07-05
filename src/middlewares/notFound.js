// MIDDLEWARE PARA RUTAS INEXISTENTES (404)
// Captura cualquier petición HTTP dirigida a una URL o método que no esté registrado en los enrutadores.
export const notFound = (req, res) => {
    res.status(404).json({
        ok: false,
        error: `Ruta no encontrada: ${req.method} ${req.url}`,
    })
}

// Nota de Buenas Prácticas:
// No llamamos a next() después de enviar la respuesta. Esto prevendría errores del tipo "Cannot set headers
// after they are sent to the client" que ocurren si se intentara ejecutar un middleware posterior (como el errorHandler).