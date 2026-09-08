export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      const error = new Error(`Acceso denegado. Se requiere rol ${role}`);
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};