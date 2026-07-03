import jwt from "jsonwebtoken"

export const authMiddleware = (req, res, next) => {
    // Obtenemos la clave secreta desde las variables de entorno
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        const error = new Error("No se encontró la clave secreta del servidor");
        error.statusCode = 500;
        return next(error);
    }

    let token = null;

    // Intentamos obtener el token de las cookies (Recomendado para React/Web)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // Si no está en cookies, intentamos recuperarlo desde la cabecera 'Authorization' (Bearer Token)
    else {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]; // Extraemos únicamente el hash del token
        }
    }

    if (!token) {
        const error = new Error("Acceso denegado. No se proporcionó un token válido.");
        error.statusCode = 403;
        return next(error);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verificamos el token con la clave secreta
        req.user = { ...decoded, id: String(decoded.id) }; // Guardamos el usuario decodificado en la req y normalizamos el id a String
        next();
    } catch (error) {
        error.statusCode = 401;
        error.message = "Sesión inválida o expirada";
        next(error);
    }
};