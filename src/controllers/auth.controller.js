import { authService } from "../services/auth.service.js";
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

    const newUser = await authService.registerUser(
      name,
      email,
      password,
      role
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


const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 2 * 60 * 60 * 1000,
});

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email y contraseña son obligatorios");
      error.statusCode = 400;
      throw error;
    }

    const { token, user } = await authService.login(email, password);

    const cookieOptions = getCookieOptions();

    res.cookie("token", token, cookieOptions);

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


const logout = (req, res, next) => {
  try {
    const cookieOptions = getCookieOptions();
    res.clearCookie("token", cookieOptions);

    res.json({
      ok: true,
      message: "Sesión cerrada",
    });

  } catch (error) {
    next(error);
  }
};


// Obtener perfil completo
const getProfile = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,

        // Perfil cinéfilo
        favoriteGenre: true,
        favoriteDirector: true,
        favoriteMovie: true,
        bio: true,
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



// Actualizar información personal
const updateProfile = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);

    const {
      name,
      email,
    } = req.body;


    let profileImageURL;


    if (req.file) {
      const uploadImage = () => {
        return new Promise((resolve, reject) => {

          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "user_profiles",
            },
            (error, result) => {
              if (result) {
                resolve(result.secure_url);
              } else {
                reject(error);
              }
            }
          );


          stream.end(req.file.buffer);
        });
      };


      profileImageURL = await uploadImage();
    }


    const dataToUpdate = {};


    if (name !== undefined) {
      dataToUpdate.name = name;
    }


    if (email !== undefined) {

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });


      if (existingUser && existingUser.id !== userId) {
        const error = new Error(
          "El email ya está siendo utilizado"
        );

        error.statusCode = 409;
        throw error;
      }


      dataToUpdate.email = email;
    }


    if (profileImageURL !== undefined) {
      dataToUpdate.profileImage = profileImageURL;
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



// Actualizar perfil cinéfilo
const updateCinephileProfile = async (req, res, next) => {
  try {

    const userId = Number(req.user.id);


    const {
      favoriteGenre,
      favoriteDirector,
      favoriteMovie,
      bio,
    } = req.body;



    const dataToUpdate = {};


    if (favoriteGenre !== undefined) {
      dataToUpdate.favoriteGenre = favoriteGenre;
    }


    if (favoriteDirector !== undefined) {
      dataToUpdate.favoriteDirector = favoriteDirector;
    }


    if (favoriteMovie !== undefined) {
      dataToUpdate.favoriteMovie = favoriteMovie;
    }


    if (bio !== undefined) {
      dataToUpdate.bio = bio;
    }



    const updatedUser =
      await authService.updateCinephileProfile(
        userId,
        dataToUpdate
      );


    res.json({
      ok: true,
      message: "Perfil cinéfilo actualizado correctamente",
      data: updatedUser,
    });


  } catch (error) {
    next(error);
  }
};



// Cambiar contraseña
const updatePassword = async (req, res, next) => {
  try {

    const userId = Number(req.user.id);

    const {
      currentPassword,
      newPassword,
    } = req.body;



    if (!currentPassword || !newPassword) {
      const error = new Error(
        "Se requiere contraseña actual y nueva"
      );

      error.statusCode = 400;
      throw error;
    }


    await authService.updatePasswordUser(
      userId,
      currentPassword,
      newPassword
    );


    res.json({
      ok: true,
      message: "Contraseña actualizada correctamente",
    });


  } catch (error) {
    next(error);
  }
};



const deleteAccount = async (req, res, next) => {
  try {

    const userId = Number(req.user.id);


    await authService.deleteUserAccount(userId);


    const cookieOptions = getCookieOptions();
    res.clearCookie("token", cookieOptions);


    res.json({
      ok: true,
      message: "Cuenta eliminada correctamente",
    });


  } catch (error) {
    next(error);
  }
};



const getAdmin = (req, res) => {
  res.json({
    ok: true,
    message: `Bienvenido al panel admin ${req.user.email}`,
  });
};

const getPublicProfile = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);

    if (Number.isNaN(userId)) {
      const error = new Error("El id de usuario no es válido");
      error.statusCode = 400;
      throw error;
    }

    const user = await authService.getPublicProfile(userId);

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

const getAllUsers = async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ ok: true, data: users });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const requestingUserId = req.user.id;

    if (!role) {
      const error = new Error("El campo 'role' es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await authService.updateUserRole(userId, role, requestingUserId);
    res.json({ ok: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    await authService.deleteUserByAdmin(userId, requestingUserId);
    res.json({ ok: true, message: "Usuario eliminado correctamente" });
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
  updateCinephileProfile,
  updatePassword,
  deleteAccount,
  getPublicProfile,
  getAllUsers,
  updateUserRole,
  deleteUserByAdmin,
};