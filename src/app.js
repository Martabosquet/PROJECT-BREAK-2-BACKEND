// 1. IMPORTACIONES DE LIBRERÍAS DE TERCEROS (Dependencias npm)
import express from 'express';
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";

// necesarias en type module porque no existen __dirname ni __filename de forma nativa
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// 2. IMPORTACIONES DE ENRUTADORES (Definen los endpoints de la API)
import productRouter from './routes/products.routes.js';
import indexRouter from './routes/index.routes.js';
import authRouter from "./routes/auth.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRouter from "./routes/cart.routes.js";

// 3. IMPORTACIONES DE MIDDLEWARES PERSONALIZADOS (Control de errores/404)
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// 4. INICIALIZACIÓN DE LA APLICACIÓN
const app = express();

// 5. MIDDLEWARES DE SEGURIDAD (Cabeceras HTTP y CORS)
// Helmet: Añade cabeceras HTTP de seguridad automáticamente
app.use(helmet());

// CORS: Permite peticiones y envío de cookies desde el Frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // importante para httpOnly
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-type", "Authorization"],
  }),
);

// 6. MIDDLEWARE DE RATE LIMIT (Protección ante abuso/DDoS)
// Limita el número de peticiones por IP en una ventana de tiempo
const limiter = rateLimit({
  windowMs: 60 * 1000, // Define la ventana de tiempo
  max: 10, // número máximo de peticiones
  message: {
    ok: false,
    error: "Demasiadas peticiones. Inténtalo de nuevo en 1 minuto.",
  },
});

if (process.env.NODE_ENV !== "test") app.use(limiter); // Si lo dejo activo para probar tests, el limitador pensará que tus propios tests son un ataque informático y empezará a bloquearlos devolviendo un error 429 Too Many Requests

// 7. MIDDLEWARES DE PARSEO (Lectura y formateo de datos entrantes)
app.use(express.json()); // le dice a express que entienda JSON
app.use(express.urlencoded({ extended: true })); // Analiza cuerpos de peticiones POST
app.use(cookieParser()); // Analiza cookies en las peticiones

// 8. DECLARACIÓN DE RUTAS DE LA API (Endpoints y controladores)
// Ruta de inicio / testeo general de la API
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API Crud completo activa",
  });
});

// guardamos la carpeta actual donde se encuentra el archivo y normalizamos con fileURLToPath
const __dirname = dirname(fileURLToPath(import.meta.url))

// Leemos el archivo swagger.json directamente
const swaggerDocument = JSON.parse(
  fs.readFileSync(join(__dirname, "../swagger.json"), "utf8"),
)

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Enrutadores específicos de recursos
app.use(reviewRoutes);
app.use(wishlistRoutes);

app.use("/", productRouter); // o se lo pongo aquí /api/products o se lo pongo en routes directamente, yo he decidido ponérselo en routes directamente
app.use("/", authRouter);
app.use("/", indexRouter);
app.use("/", cartRouter);

// 9. MIDDLEWARES FINALES (Manejo del ciclo de vida de peticiones fallidas)
app.use(notFound);      // Captura cualquier petición a una url inexistente
app.use(errorHandler);  // Recibe errores propagados con next(error) desde cualquier controller

// 10. EXPORTACIÓN DEL MÓDULO
export default app;