const allowedOrigins = [
  "https://projectbreak3.netlify.app",
  "https://project-break-2-t70h.onrender.com",
]

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

export const verifyOrigin = (req, res, next) => {
  const methodsWithSideEffects = ["POST", "PUT", "PATCH", "DELETE"]

  if (
    methodsWithSideEffects.includes(req.method) &&
    req.path !== "/api/webhooks/stripe" &&
    !isAllowedOrigin(req.headers.origin)
  ) {
    const error = new Error("Origen no permitido para esta operación")
    error.statusCode = 403
    return next(error)
  }

  next()
}
