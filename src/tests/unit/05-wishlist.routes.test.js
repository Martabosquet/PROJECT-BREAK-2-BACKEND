process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

import { jest } from "@jest/globals"

const wishlistController = {
  getWishlistByUser: jest.fn((req, res) => res.json({ ok: true, data: [] })),
  addToWishlist: jest.fn((req, res) => res.status(201).json({ ok: true, data: { id: "wishlist-1" } })),
  removeFromWishlist: jest.fn((req, res) => res.json({ ok: true, message: "Eliminado" })),
}

await jest.unstable_mockModule("../../controllers/wishlist.controller.js", () => ({
  __esModule: true,
  ...wishlistController,
}))

const request = (await import("supertest")).default
const jwt = (await import("jsonwebtoken")).default
const { default: app } = await import("../../app.js")

const userToken = jwt.sign({ id: "user-1", email: "user@example.com", role: "user" }, process.env.JWT_SECRET, { expiresIn: "2h" })
const adminToken = jwt.sign({ id: "admin-1", email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" })

describe("💝 WISHLIST ENDPOINTS", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/wishlist - Obtener lista de deseos", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).get("/api/wishlist")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("devuelve wishlist con token válido", async () => {
      const res = await request(app).get("/api/wishlist").set("Authorization", `Bearer ${userToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe("POST /api/wishlist/:productId - Añadir producto a lista de deseos", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).post("/api/wishlist/test-product")

      expect([401, 403]).toContain(res.statusCode)
    })

    test("añade producto con usuario autenticado", async () => {
      const res = await request(app)
        .post("/api/wishlist/test-product")
        .set("Authorization", `Bearer ${userToken}`)

      expect(res.statusCode).toBe(201)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("wishlist-1")
    })

    test("valida que productId sea obligatorio", async () => {
      const res = await request(app)
        .post("/api/wishlist/")
        .set("Authorization", `Bearer ${userToken}`)

      expect([400, 404]).toContain(res.statusCode)
    })
  })

  describe("DELETE /api/wishlist/:id - Eliminar producto de lista de deseos", () => {
    test("deniega acceso a usuario normal", async () => {
      const res = await request(app)
        .delete("/api/wishlist/wishlist-1")
        .set("Authorization", `Bearer ${userToken}`)

      expect(res.statusCode).toBe(403)
      expect(res.body.ok).toBe(false)
    })

    test("permite acceso a admin", async () => {
      const res = await request(app)
        .delete("/api/wishlist/wishlist-1")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.message).toMatch(/eliminado/i)
    })

    test("requiere autenticación", async () => {
      const res = await request(app).delete("/api/wishlist/wishlist-1")

      expect([401, 403]).toContain(res.statusCode)
    })
  })
})
