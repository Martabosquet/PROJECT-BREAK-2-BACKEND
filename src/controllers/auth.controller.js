import { authService } from "../services/auth.service.js"
import prisma from "../config/prismaClient.js";
import cloudinary from "../config/cloudinary.js";

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      const error = new Error("Email y contraseña son requeridos");
      error.statusCode = 400;
      throw error;
    }

    const newUser = await authService.registerUser(name, email, password, role);

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

    if (!email || !password) {
      const error = new Error("Email y contraseña son obligatorios")
      error.statusCode = 400
      throw error
    }

    const { token, user } = await authService.login(email, password)

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 2 * 60 * 60 * 1000,
    }

    res.cookie("token", token, cookieOptions)

    res.json({
      ok: true,
      message: "El login se realizó con éxito",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

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
    }) 
  } catch (error) {
    next(error);
  }
}

const getProfile = async (req, res, next) => {
  try {
    const userId = Number(req.user.id); // 🟢 Convertimos a número

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    if (!user) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getAdmin = (req, res) => {
  res.json({
    ok: true,
    message: `Bienvenido al panel de admin, ${req.user.email}`,
  })
}

const updateProfile = async (req, res, next) => {
  try {
    const userId = Number(req.user.id); // 🟢 Convertimos a número
    const { name, email } = req.body;

    let profileImageURL = undefined;

    if (req.file) {
      const uploadToCloudinary = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "user_profiles" },
            (error, result) => {
              if (result) resolve(result.secure_url);
              else reject(error);
            }
          );
          stream.end(req.file.buffer);
        });
      };

      profileImageURL = await uploadToCloudinary();
    }

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        const error = new Error("El email ya está en uso por otro usuario");
        error.statusCode = 409;
        throw error;
      }
      dataToUpdate.email = email;
    }
    
    if (profileImageURL !== undefined) {
      dataToUpdate.profileImage = profileImageURL;
    }

    const updatedUser = await authService.updateProfileUser(userId, dataToUpdate);

    res.json({
      ok: true,
      message: "Perfil actualizado con éxito",
      data: updatedUser,
    });

  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = Number(req.user.id); // 🟢 Convertimos a número
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error = new Error("Se requiere la contraseña actual y la nueva");
      error.statusCode = 400;
      throw error;
    }

    await authService.updatePasswordUser(userId, currentPassword, newPassword);

    res.json({
      ok: true,
      message: "Contraseña actualizada con éxito",
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const userId = Number(req.user.id); // 🟢 Convertimos a número

    await authService.deleteUserAccount(userId);

    res.clearCookie("token");

    res.json({
      ok: true,
      message: "Cuenta eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  register,
  login,
  logout,
  getProfile,
  getAdmin,
  updateProfile,
  updatePassword,
  deleteAccount,
}