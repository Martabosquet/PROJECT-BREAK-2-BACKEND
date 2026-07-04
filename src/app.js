// IMPORTACIONES DE LIBRERÍAS DE TERCEROS (Dependencias npm)
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

// IMPORTACIONES DE ENRUTADORES (Definen los endpoints de la API)
import productRouter from './routes/products.routes.js';
import indexRouter from './routes/index.routes.js';
import authRouter from "./routes/auth.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRouter from "./routes/cart.routes.js";

// IMPORTACIONES DE MIDDLEWARES PERSONALIZADOS (Control de errores/404)
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// INICIALIZACIÓN DE LA APLICACIÓN
const app = express();

// MIDDLEWARES DE SEGURIDAD (Cabeceras HTTP y CORS)
app.use(helmet());

const allowedOrigins = [
  "https://project-break-2-px4e.onrender.com",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // 1. Permitir peticiones sin origen (como Postman, Swagger local, o apps móviles)
      if (!origin) return callback(null, true);

      // 2. Permitir si el origen está en la lista blanca
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        // Si quieres ser permisivo en desarrollo, puedes dejar pasar todo, 
        // pero para producción esto protege tu API:
        return callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true, // Crucial para que funcionen las cookies httpOnly
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MIDDLEWARE DE RATE LIMIT (Protección ante abuso/DDoS)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    ok: false,
    error: "Demasiadas peticiones. Inténtalo de nuevo en 1 minuto.",
  },
});

if (process.env.NODE_ENV !== "test") app.use(limiter); // Si lo dejo activo para probar tests, el limitador pensará que tus propios tests son un ataque informático y empezará a bloquearlos devolviendo un error 429 Too Many Requests

app.set('trust proxy', 1);

// MIDDLEWARES DE PARSEO (Lectura y formateo de datos entrantes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DECLARACIÓN DE RUTAS DE LA API (Endpoints y controladores)
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API Crud completo activa",
  });
});

const __dirname = dirname(fileURLToPath(import.meta.url))

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

// MIDDLEWARES FINALES (Manejo del ciclo de vida de peticiones fallidas)
app.use(notFound);
app.use(errorHandler);

// EXPORTACIÓN DEL MÓDULO
export default app;