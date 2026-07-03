process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

import { jest } from "@jest/globals"

await jest.unstable_mockModule("../../services/auth.service.js", () => ({
  __esModule: true,
  authService: {
    registerUser: jest.fn(),
    login: jest.fn(),
  },
}))

const request = (await import("supertest")).default
const jwt = (await import("jsonwebtoken")).default
const { default: app } = await import("../../app.js")
const { authService } = await import("../../services/auth.service.js")

describe("🔐 AUTH ENDPOINTS", () => {
  describe("POST /api/auth/register - Registro de usuario", () => {
    beforeEach(() => {
      jest.clearAllMocks()
      process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"
    })

    test("devuelve 201 y datos del usuario cuando el registro es válido", async () => {
      authService.registerUser.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        role: "user",
      })

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com", password: "password123", role: "user" })

      expect(res.statusCode).toBe(201)
      expect(res.body.ok).toBe(true)
      expect(res.body.data).toMatchObject({ id: "user-123", email: "test@example.com", role: "user" })
      expect(authService.registerUser).toHaveBeenCalledWith("test@example.com", "password123", "user")
    })
  })

  describe("POST /api/auth/login - Inicio de sesión", () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test("devuelve 200 y establece cookie cuando las credenciales son válidas", async () => {
      authService.login.mockResolvedValue("valid-token")

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" })

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.headers["set-cookie"]).toBeDefined()
      expect(authService.login).toHaveBeenCalledWith("test@example.com", "password123")
    })
  })

  describe("POST /api/auth/logout - Cierre de sesión", () => {
    test("limpia la cookie del token y devuelve 200", async () => {
      const token = jwt.sign(
        { id: "user-1", email: "test@example.com", role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      )

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.message).toMatch(/cerrada|logout/i)
    })
  })

  describe("GET /api/me - Obtener perfil del usuario", () => {
    test("rechaza acceso sin token", async () => {
      const res = await request(app).get("/api/me")

      expect([401, 403]).toContain(res.statusCode)
      expect(res.body.ok).toBe(false)
      expect(res.body).toHaveProperty("error")
    })

    test("devuelve perfil con token válido", async () => {
      const token = jwt.sign(
        { id: "user-1", email: "test@example.com", role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      )

      const res = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data).toMatchObject({ id: "user-1", email: "test@example.com", role: "user" })
    })
  })

  describe("GET /api/admin - Panel de administración", () => {
    test("deniega acceso a usuario normal", async () => {
      const token = jwt.sign(
        { id: "user-1", email: "test@example.com", role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      )

      const res = await request(app)
        .get("/api/admin")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(403)
      expect(res.body.ok).toBe(false)
      expect(res.body.error).toMatch(/rol admin/i)
    })

    test("permite acceso a admin", async () => {
      const token = jwt.sign(
        { id: "admin-1", email: "admin@example.com", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      )

      const res = await request(app)
        .get("/api/admin")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.message).toMatch(/Bienvenido al panel de admin/i)
    })
  })
})
