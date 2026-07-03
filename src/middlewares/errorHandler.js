export const errorHandler = (error, req, res, next) => {
    console.error("❌ Error capturado en el handler:", error.message);

    // 1. Manejo y formateo de errores específicos de base de datos de Prisma
    // Código 'P2002': Error de violación de clave única/restricción única (ej. email duplicado)
    if (error.code === 'P2002') {
        error.statusCode = 409;
        error.message = "El registro ya existe (campo duplicado).";
    }

    // Código 'P2025': Ocurre cuando no se encuentra un registro en operaciones de update o delete
    if (error.code === 'P2025') {
        error.statusCode = 404; // Not Found
        error.message = "El recurso solicitado no existe.";
    }

    // 2. Extraemos el código de estado (por defecto 500 si no fue asignado previamente)
    const statusCode = error.statusCode || 500;
    const message = error.message || "Error interno del servidor";

    // 3. Respondemos al cliente con formato estructurado
    res.status(statusCode).json({
        ok: false,
        error: message,
        statusCode,
        // Solo incluimos la traza detallada del error (stack trace) en entornos de desarrollo para evitar fugar datos sensibles en producción
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    });
};