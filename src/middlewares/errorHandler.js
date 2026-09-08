export const errorHandler = (error, req, res, next) => {
    console.error("❌ Error capturado en el handler:", error.message);

    // Error de clave duplicada en Prisma ('P2002') o en Mongoose (11000)
    if (error.code === 'P2002' || error.code === 11000) {
        error.statusCode = 409;
        error.message = "El registro ya existe (campo duplicado).";
    }

    // Registro no encontrado en Prisma ('P2025')
    if (error.code === 'P2025') {
        error.statusCode = 404;
        error.message = "El recurso solicitado no existe.";
    }

    // ID de Mongoose con formato no válido
    if (error.name === 'CastError') {
        error.statusCode = 400;
        error.message = "El identificador proporcionado no es válido.";
    }

    // Validación de esquema en Mongoose
    if (error.name === 'ValidationError') {
        error.statusCode = 400;
        error.message = Object.values(error.errors)
            .map((e) => e.message)
            .join(', ');
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || "Error interno del servidor";

    // Respondemos con formato unificado y compatible
    res.status(statusCode).json({
        ok: false,
        message,
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    });
};