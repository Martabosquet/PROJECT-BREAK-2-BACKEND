//PRODUCTOS: Crear productos, leer productos, actualizar productos y eliminar productos

import express from "express"
import { requireRole } from "../middlewares/requireRole.js"
import { authMiddleware } from "../middlewares/authenticate.js"
import { validateProduct } from "../middlewares/validateProduct.js"
import { productsController } from "../controllers/products.controller.js"
import upload from "../config/multer.js"; // Middleware para procesar la imagen

const router = express.Router()

// --- RUTAS PÚBLICAS ---
router.get("/api/products", productsController.getProducts)
router.get("/api/products/:id", productsController.getProductById)

// --- RUTAS PRIVADAS (Solo Admin) ---

router.post( // crear con cloudinary
  "/api/products",
  authMiddleware,
  requireRole("admin"),
  upload.single("image"), // intercepta imagen
  validateProduct,        // valida los textos del body
  productsController.createProduct // sube a Cloudinary y guarda en BD
);

router.put("/api/products/:id", authMiddleware, requireRole("admin"), upload.single("image"), productsController.updateProduct)
router.delete("/api/products/:id", authMiddleware, requireRole("admin"), productsController.deleteProduct)

export default router