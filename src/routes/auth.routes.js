//AUTENTICACIÓN: GESTIONA REGISTRO, LOGIN, JWT, MIDDLEWARE AUTH Y ROLES DE USUARIO

import express from "express"
import { authController } from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/authenticate.js"
import { requireRole } from "../middlewares/requireRole.js"
import upload from "../config/multer.js"; // Middleware para procesar la imagen

const router = express.Router()

// Rutas públicas
router.post('/api/auth/register', upload.single('profileImage'), authController.register);
router.post("/api/auth/login", authController.login);
router.post("/api/auth/logout", authController.logout);
router.get("/api/users/:userId", authController.getPublicProfile);  // Obtener perfil público de otro usuario

// Ruta protegida (accedemos al perfil de usuario con el token)
router.get("/api/me", authMiddleware, authController.getProfile);
router.put("/api/me", authMiddleware, upload.single('profileImage'), authController.updateProfile);  // AQUÍ AÑADIMOS upload.single('profileImage') para que capture el archivo y lo suba a Cloudinary
router.put("/api/me/password", authMiddleware, authController.updatePassword); // Para cambiar contraseña
router.delete("/api/me", authMiddleware, authController.deleteAccount); // Para eliminar cuenta
router.patch("/api/profile", authMiddleware, upload.single("profileImage"), authController.updateProfile);  // Actualizar datos personales
router.patch("/api/profile/cinephile", authMiddleware, authController.updateCinephileProfile);  // Actualizar perfil cinéfilo

// Panel de administración (ADMIN)
router.get("/api/admin", authMiddleware, requireRole("admin"), authController.getAdmin);

// Rutas exclusivas de administración de usuarios
router.get("/api/admin/users", authMiddleware, requireRole("admin"), authController.getAllUsers);
router.patch("/api/admin/users/:userId/role", authMiddleware, requireRole("admin"), authController.updateUserRole);
router.delete("/api/admin/users/:userId", authMiddleware, requireRole("admin"), authController.deleteUserByAdmin);



export default router