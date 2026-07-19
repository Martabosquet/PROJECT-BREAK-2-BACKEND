import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../config/prismaClient.js"

const registerUser = async (name, email, password, role) => {
  // Validamos que el email no esté ya registrado en la base de datos
  const userExists = await prisma.user.findUnique({
    where: { email },
  })

  if (userExists) {
    const error = new Error("El email ya está registrado")
    error.statusCode = 409
    throw error
  }

  // Encriptamos la contraseña usando bcrypt con un factor de 10
  const hashedPassword = await bcrypt.hash(password, 10)

  // Insertamos el nuevo registro de usuario en PostgreSQL
  const newUser = await prisma.user.create({
    data: {
      name,  //guardamos el nombre, que nos servirá para mostrarlo en el frontend y para personalizar la experiencia del usuario
      email,
      password: hashedPassword,
      role,
    },
    // Seleccionamos específicamente qué campos retornar para evitar enviar el hash de la contraseña en la respuesta
    select: {
      id: true,
      name: true,   // lo devolvemos también en la respuesta del registro
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

  // Comparamos la contraseña en texto plano enviada con el hash encriptado de la BD
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

  // en vez de devolver solo el token, devolvemos también los datos
  // del usuario (sin la contraseña) para que el controlador pueda mandarlos al frontend
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
}

export const authService = {
  registerUser,
  login
}