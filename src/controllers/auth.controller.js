import { authService } from "../services/auth.service.js";
import cloudinary from "../config/cloudinary.js";


// ================================ HELPERS ========================================

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 2 * 60 * 60 * 1000,
});


const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};


const getUserId = (req) => {
  const userId = Number(req.user.id);

  if (Number.isNaN(userId)) {
    throw createError("El id de usuario no es válido", 400);
  }

  return userId;
};


const uploadProfileImage = (file) => {
  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "user_profiles",
      },
      (error, result) => {

        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};


// ================================= REGISTER ================================

const register = async (req, res, next) => {

  try {

    const {
      name,
      email,
      password,
    } = req.body;


    if (!email || !password) {
      throw createError(
        "Email y contraseña son requeridos",
        400
      );
    }


    // No permitimos que el usuario decida su propio role durante el registro.
    // El servicio asignará "user" por defecto.

    const newUser = await authService.registerUser(
      name,
      email,
      password
    );


    res.status(201).json({
      ok: true,
      message: "Usuario registrado con éxito",
      data: newUser,
    });

  } catch (error) {

    next(error);

  }
};


// ============== LOGIN ================================================

const login = async (req, res, next) => {

  try {

    const {
      email,
      password,
    } = req.body;


    if (!email || !password) {
      throw createError(
        "Email y contraseña son obligatorios",
        400
      );
    }


    const {
      token,
      user,
    } = await authService.login(
      email,
      password
    );


    res.cookie(
      "token",
      token,
      getCookieOptions()
    );


    res.json({
      ok: true,
      message: "El login se realizó con éxito",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {

    next(error);

  }
};


// ============================== LOGOUT ===================================

const logout = (req, res, next) => {

  try {

    res.clearCookie(
      "token",
      getCookieOptions()
    );


    res.json({
      ok: true,
      message: "Sesión cerrada",
    });

  } catch (error) {

    next(error);

  }
};


// ================== GET MY PROFILE ============================

const getProfile = async (req, res, next) => {

  try {

    const userId = getUserId(req);

    const user =
      await authService.getProfile(userId);


    if (!user) {
      throw createError(
        "Usuario no encontrado",
        404
      );
    }


    res.json({
      ok: true,
      data: user,
    });

  } catch (error) {

    next(error);

  }
};

// ================== GET DASHBOARD STATS =========================

const getDashboardStats = async (req, res, next) => {
  try {
    // Si tienes los métodos en tu authService o servicios específicos:
    const stats = await authService.getDashboardStats();

    res.json({
      ok: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// ================== UPDATE PERSONAL PROFILE ==========================

const updateProfile = async (req, res, next) => {

  try {

    const userId = getUserId(req);

    const {
      name,
      email,
    } = req.body;


    const dataToUpdate = {};


    if (name !== undefined) {
      dataToUpdate.name = name;
    }


    if (email !== undefined) {
      dataToUpdate.email = email;
    }


    // Si se ha enviado una nueva imagen, la subimos a Cloudinary.

    if (req.file) {

      const profileImageURL =
        await uploadProfileImage(req.file);

      dataToUpdate.profileImage =
        profileImageURL;
    }


    // Si no hay ningún cambio, evitamos hacer una petición UPDATE innecesaria.

    if (Object.keys(dataToUpdate).length === 0) {

      throw createError(
        "No se han proporcionado datos para actualizar",
        400
      );

    }


    const updatedUser =
      await authService.updateProfileUser(
        userId,
        dataToUpdate
      );


    res.json({
      ok: true,
      message: "Perfil actualizado correctamente",
      data: updatedUser,
    });

  } catch (error) {

    next(error);

  }
};


// ================== UPDATE CINEPHILE PROFILE =========================

const updateCinephileProfile = async (
  req,
  res,
  next
) => {

  try {

    const userId = getUserId(req);


    const {
      favoriteGenre,
      favoriteDirector,
      favoriteMovie,
      bio,
    } = req.body;


    const dataToUpdate = {};


    if (favoriteGenre !== undefined) {
      dataToUpdate.favoriteGenre =
        favoriteGenre;
    }


    if (favoriteDirector !== undefined) {
      dataToUpdate.favoriteDirector =
        favoriteDirector;
    }


    if (favoriteMovie !== undefined) {
      dataToUpdate.favoriteMovie =
        favoriteMovie;
    }


    if (bio !== undefined) {
      dataToUpdate.bio = bio;
    }


    if (Object.keys(dataToUpdate).length === 0) {

      throw createError(
        "No se han proporcionado datos para actualizar",
        400
      );

    }


    const updatedUser =
      await authService.updateCinephileProfile(
        userId,
        dataToUpdate
      );


    res.json({
      ok: true,
      message:
        "Perfil cinéfilo actualizado correctamente",
      data: updatedUser,
    });

  } catch (error) {

    next(error);

  }
};


// ================== UPDATE PASSWORD =========================

const updatePassword = async (
  req,
  res,
  next
) => {

  try {

    const userId = getUserId(req);


    const {
      currentPassword,
      newPassword,
    } = req.body;


    if (!currentPassword || !newPassword) {

      throw createError(
        "Se requiere contraseña actual y nueva",
        400
      );

    }


    await authService.updatePasswordUser(
      userId,
      currentPassword,
      newPassword
    );


    res.json({
      ok: true,
      message:
        "Contraseña actualizada correctamente",
    });

  } catch (error) {

    next(error);

  }
};


// ================== DELETE MY ACCOUNT =========================

const deleteAccount = async (
  req,
  res,
  next
) => {

  try {

    const userId = getUserId(req);


    await authService.deleteUserAccount(
      userId
    );


    res.clearCookie(
      "token",
      getCookieOptions()
    );


    res.json({
      ok: true,
      message:
        "Cuenta eliminada correctamente",
    });

  } catch (error) {

    next(error);

  }
};


// ============================== ADMIN ============================

const getAdmin = (req, res) => {

  res.json({
    ok: true,
    message:
      `Bienvenido al panel admin ${req.user.email}`,
  });

};


// ================== PUBLIC PROFILE =========================

const getPublicProfile = async (
  req,
  res,
  next
) => {

  try {

    const userId =
      Number(req.params.userId);


    if (Number.isNaN(userId)) {

      throw createError(
        "El id de usuario no es válido",
        400
      );

    }


    const user =
      await authService.getPublicProfile(
        userId
      );


    if (!user) {

      throw createError(
        "Usuario no encontrado",
        404
      );

    }


    res.json({
      ok: true,
      data: user,
    });

  } catch (error) {

    next(error);

  }
};


// ================== GET ALL USERS =========================

const getAllUsers = async (
  req,
  res,
  next
) => {

  try {

    const users =
      await authService.getAllUsers();


    res.json({
      ok: true,
      data: users,
    });

  } catch (error) {

    next(error);

  }
};


// ================== UPDATE USER ROLE =========================

const updateUserRole = async (
  req,
  res,
  next
) => {

  try {

    const {
      userId,
    } = req.params;


    const {
      role,
    } = req.body;


    const requestingUserId =
      Number(req.user.id);


    if (!role) {

      throw createError(
        "El campo 'role' es obligatorio",
        400
      );

    }


    if (Number.isNaN(requestingUserId)) {

      throw createError(
        "El id del usuario solicitante no es válido",
        400
      );

    }


    const updatedUser =
      await authService.updateUserRole(
        userId,
        role,
        requestingUserId
      );


    res.json({
      ok: true,
      data: updatedUser,
    });

  } catch (error) {

    next(error);

  }
};


// ================== DELETE USER BY ADMIN =========================

const deleteUserByAdmin = async (
  req,
  res,
  next
) => {

  try {

    const {
      userId,
    } = req.params;


    const requestingUserId =
      Number(req.user.id);


    if (Number.isNaN(requestingUserId)) {

      throw createError(
        "El id del usuario solicitante no es válido",
        400
      );

    }


    await authService.deleteUserByAdmin(
      userId,
      requestingUserId
    );


    res.json({
      ok: true,
      message:
        "Usuario eliminado correctamente",
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

  getDashboardStats,
  updateProfile,
  updateCinephileProfile,

  updatePassword,
  deleteAccount,

  getPublicProfile,
  getAllUsers,

  updateUserRole,
  deleteUserByAdmin,

};