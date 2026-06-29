import { jest } from "@jest/globals"

const bcryptMock = { hash: jest.fn(), compare: jest.fn() }
const jwtMock = { sign: jest.fn() }
const prismaMock = { user: { findUnique: jest.fn(), create: jest.fn() } }

await jest.unstable_mockModule("bcrypt", () => ({
  __esModule: true,
  default: bcryptMock,
}))
await jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: jwtMock,
}))
await jest.unstable_mockModule("../../config/prismaClient.js", () => ({
  __esModule: true,
  default: prismaMock,
}))

const { default: bcrypt } = await import("bcrypt")
const { default: jwt } = await import("jsonwebtoken")
const { default: prisma } = await import("../../config/prismaClient.js")
const { authService } = await import("../../services/auth.service.js")

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = "test-secret"
  })

  describe("registerUser", () => {
    it("creates a user when the email is not registered", async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      bcrypt.hash.mockResolvedValue("hashed-password")
      prisma.user.create.mockResolvedValue({
        id: "user-id",
        email: "test@example.com",
        role: "user",
        createdAt: new Date(),
      })

      const result = await authService.registerUser("test@example.com", "password123", "user")

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } })
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed-password",
          role: "user",
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })
      expect(result).toMatchObject({ id: "user-id", email: "test@example.com", role: "user" })
    })

    it("throws when the email is already registered", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-id", email: "test@example.com" })

      await expect(authService.registerUser("test@example.com", "password123", "user")).rejects.toThrow(
        "El email ya está registrado",
      )
    })
  })

  describe("login", () => {
    it("returns a token when credentials are valid", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-id",
        email: "test@example.com",
        password: "crypted",
        role: "user",
      })
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign.mockReturnValue("valid-token")

      const token = await authService.login("test@example.com", "password123")

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } })
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "crypted")
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: "user-id",
          email: "test@example.com",
          role: "user",
        },
        "test-secret",
        { expiresIn: "2h" },
      )
      expect(token).toBe("valid-token")
    })

    it("throws when the user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.login("test@example.com", "password123")).rejects.toThrow(
        "El email o la contraseña no son válidos",
      )
    })

    it("throws when the password is invalid", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-id",
        email: "test@example.com",
        password: "crypted",
        role: "user",
      })
      bcrypt.compare.mockResolvedValue(false)

      await expect(authService.login("test@example.com", "wrong-password")).rejects.toThrow(
        "El email o la contraseña no son válidos",
      )
    })
  })
})
