//AQUÍ SOLO SE DEFINE LA APP: SE ENCARGA DE CONFIGURAR EL SERVIDOR, LOS MIDDLEWARES Y LAS RUTAS

import express from 'express';
import cookieParser from "cookie-parser";
import helmet from "helmet"

import cors from "cors"
import rateLimit from "express-rate-limit"

import productRouter from './routes/products.routes.js';
import indexRouter from './routes/index.routes.js';
import authRouter from "./routes/auth.routes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRouter from "./routes/cart.routes.js";

import { notFound } from "./middlewares/notFound.js"
import { errorHandler } from "./middlewares/errorHandler.js"

const app = express();

// Helmet: Añade cabeceras HTTP de seguridad automáticamente
app.use(helmet())

// CORS: permite que el front acceda a la api y las cookies de diferente origen (nuestro back)

app.use(
  cors({
    origin: "http://localhost:5500" || "http://127.0.0.1:5500", // nos lo da live server
    credentials: true, // importante para httpOnly
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-type"],
  }),
)

// Rate limit: máximo 10 peticiones por minuto

const limiter = rateLimit({
  windowMs: 60 * 1000, // Define la ventana de tiempo
  max: 10, // número máximo de peticiones
  message: {
    ok: false,
    error: "Demasiadas peticiones. Inténtalo de nuevo en 1 minuto.",
  },
})

app.use(limiter)

app.use(express.json()) // le dice a express que entienda JSON
app.use(express.urlencoded({ extended: true })) // Analiza cuerpos de peticiones POST
app.use(cookieParser()) // Analiza cookies en las peticiones

app.use(reviewRoutes)
app.use(wishlistRoutes)

app.use("/", productRouter) //o se lo pongo aquí /api/products o se lo pongo en routes directamente, yo he decidido ponérselo en routes directamente
app.use("/", authRouter)
app.use("/", indexRouter)
app.use("/api/cart", cartRouter)

app.use(notFound)
app.use(errorHandler)

app.get("/", (req, res) => {
  res.json({
    message: "API Crud completo activa",
  })
})

export default app