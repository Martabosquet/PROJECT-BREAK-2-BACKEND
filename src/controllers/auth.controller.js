import { authService } from "../services/auth.service.js"

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const newUser = await authService.registerUser(email, password, role);

    res.status(201).json({
      message: "Usuario registrado con éxito",
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email y contraseña son obligatorios",
      })
    }

    const token = await authService.login(email, password)

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      maxAge: 2 * 60 * 60 * 1000,
    }

    res.cookie("token", token, cookieOptions)

    res.json({
      ok: true,
      message: "El login se realizó con éxito",
      token,
    })

  } catch (error) {
    res.status(401).json({
      ok: false,
      error: error.message,
    })
  }
}

const logout = (req, res) => {
  res.json({
    ok: true,
    message: "Sesión cerrada",
  })
}

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