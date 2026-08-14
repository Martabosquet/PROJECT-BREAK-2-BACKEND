import jwt from "jsonwebtoken"

export const authMiddleware = (req, res, next) => {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        const error = new Error("No se encontró la clave secreta del servidor");
        error.statusCode = 500;
        return next(error);
    }

    let token = null;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    else {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        const error = new Error("Acceso denegado. No se proporcionó un token válido.");
        error.statusCode = 401; //así cuando devuelva el 401 el frontend lo pueda interpretar como que no está logueado o no tiene permiso
        return next(error);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { ...decoded, id: String(decoded.id) };
        next();
    } catch (error) {
        error.statusCode = 401;
        error.message = "Sesión inválida o expirada";
        next(error);
    }
};