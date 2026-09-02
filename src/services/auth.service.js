import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../config/prismaClient.js"
import cloudinary from "../config/cloudinary.js";

const registerUser = async (name, email, password, role) => {
  const userExists = await prisma.user.findUnique({
    where: { email },
  })

  if (userExists) {
    const error = new Error("El email ya está registrado")
    error.statusCode = 409
    throw error
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "user", //siempre user al registrarse
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  return newUser
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    const error = new Error("El email o la contraseña no son válidos")
    error.statusCode = 401
    throw error
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    const error = new Error("El email o la contraseña no son válidos")
    error.statusCode = 401
    throw error
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  )

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,

      favoriteGenre: user.favoriteGenre,
      favoriteDirector: user.favoriteDirector,
      favoriteMovie: user.favoriteMovie,
      bio: user.bio,
    },
  }
}

const updateProfileUser = async (userId, dataToUpdate) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
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

  return updatedUser;
};

const updatePasswordUser = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    const error = new Error("La contraseña actual es incorrecta");
    error.statusCode = 401;
    throw error;
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
};

const deleteUserAccount = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({
    where: { id: userId },
  });
};

const updateCinephileProfile = async (userId, data) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data,
    select: {
      id: true,
      favoriteGenre: true,
      favoriteDirector: true,
      favoriteMovie: true,
      bio: true,
    },
  });
};

const getProfile = async (userId) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,

      favoriteGenre: true,
      favoriteDirector: true,
      favoriteMovie: true,
      bio: true,
    },
  });
};

const getPublicProfile = async (userId) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      favoriteGenre: true,
      favoriteMovie: true,
      favoriteDirector: true,
      bio: true,
      createdAt: true,
    },
  });
};

const VALID_ROLES = ["user", "admin"];

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateUserRole = async (userId, role, requestingUserId) => {
  if (!VALID_ROLES.includes(role)) {
    const error = new Error(`Rol inválido. Debe ser uno de: ${VALID_ROLES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (Number(userId) === Number(requestingUserId)) {
    const error = new Error("No puedes cambiar tu propio rol");
    error.statusCode = 403;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!existingUser) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  return prisma.user.update({
    where: { id: Number(userId) },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
    },
  });
};

const deleteUserByAdmin = async (userId, requestingUserId) => {
  if (Number(userId) === Number(requestingUserId)) {
    const error = new Error("No puedes eliminar tu propia cuenta desde aquí");
    error.statusCode = 403;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!existingUser) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({ where: { id: Number(userId) } });
};

// ================== DASHBOARD STATS =========================
const getDashboardStats = async () => {
  const [totalProducts, totalUsers, totalOrders, orders] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.findMany({
      select: { total: true },
    }),
  ]);

  const totalRevenue = orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);

  return {
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue.toFixed(2),
  };
};

export const authService = {
  registerUser,
  login,
  updateProfileUser,
  updatePasswordUser,
  deleteUserAccount,
  updateCinephileProfile,
  getProfile,
  getPublicProfile,
  getAllUsers,
  updateUserRole,
  deleteUserByAdmin,
  getDashboardStats,
}