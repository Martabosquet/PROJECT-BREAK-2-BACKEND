import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../config/prismaClient.js"

const registerUser = async (email, password, role) => {
  const userExists = await prisma.user.findUnique({
    where: { email },
  })

  if (userExists) {
    throw new Error("El email ya está registrado")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
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
    throw new Error("El email o la contraseña no son válidos")
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    throw new Error("El email o la contraseña no son válidos")
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

  return token
}

export const authService = {
  registerUser,
  login
}