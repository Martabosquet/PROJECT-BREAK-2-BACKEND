import { authService } from "../services/auth.service.js"

const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    //para el ejercicio, permito que al registrar el usuario se pueda asignar el rol de admin, pero en la realidad no se suele permitir
    // Se codifica como para que el rol por defecto sea user. Aquí también, si no especificas el rol, se te asigna directamente user

    if (!email || !password) {
      const error = new Error("Email y contraseña son requeridos");
      error.statusCode = 400;
      throw error;
    }

    const newUser = await authService.registerUser(email, password, role);

    res.status(201).json({
      ok: true,
      message: "Usuario registrado con éxito",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validación básica de campos requeridos
    if (!email || !password) {
      const error = new Error("Email y contraseña son obligatorios")
      error.statusCode = 400
      throw error
    }

    // Verificamos credenciales con el servicio y obtenemos el token JWT firmado
    const token = await authService.login(email, password)

    // Configuramos las opciones de la cookie para proteger el JWT
    // En desarrollo: sameSite: "lax" para permitir cookies locales sin requerir Secure
    // En producción: sameSite: "none" + secure: true para CORS con React en otro dominio
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS en producción
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "lax" en dev, "none" en prod
      maxAge: 2 * 60 * 60 * 1000,
    }

    res.cookie("token", token, cookieOptions)

    res.json({
      ok: true,
      message: "El login se realizó con éxito",
    }) //no enseño el token en la respuesta, para evitar que alguien lo pueda robar. Solo lo guardo en la cookie (en postman se me queda guardado para que pueda usarlo automáticamente en las peticiones que lo requieran)
    //(en swagger lo busco en inspeccionar -> network -> login -> setCookie)

  } catch (error) {
    next(error);
  }
}

const logout = (req, res, next) => {
  try {
    res.clearCookie("token")
    res.json({
      ok: true,
      message: "Sesión cerrada",
    }) //no hay que indicar qué usuario es el que cierra sesión, solo borra la cookie
  } catch (error) {
    next(error);
  }
} //buena práctica de cara a front-end que aunque des varios clicks en cerrar sesión siga saliendo "Sesión cerrada" y no dé error (endpoint silencioso e idempotente)

const getProfile = (req, res) => {
  res.json({
    ok: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  })
}

const getAdmin = (req, res) => {
  res.json({
    ok: true,
    message: `Bienvenido al panel de admin, ${req.user.email}`,
  })
}

export const authController = {
  register,
  login,
  logout,
  getProfile,
  getAdmin,
}