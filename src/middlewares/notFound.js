// Se registra después de todas las rutas
// Captura cualquier petición a una url inexistente

export const notFound = (req, res, next) => {
    res.status(404).json({
        ok: false,
        error: `Ruta no encontrada: ${req.method} ${req.url}`,
    })

    next()
}