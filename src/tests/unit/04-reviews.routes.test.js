process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

import { jest } from "@jest/globals"

const reviewController = {
  createReview: jest.fn((req, res) => res.status(201).json({ ok: true, data: { id: "review-1", ...req.body } })),
  getReviewsByProduct: jest.fn((req, res) => res.json({ ok: true, data: [] })),
  updateReview: jest.fn((req, res) => res.json({ ok: true, data: { id: "review-1", ...req.body } })),
  deleteReview: jest.fn((req, res) => res.json({ ok: true, message: "Review eliminada" })),
}

await jest.unstable_mockModule("../../controllers/review.controller.js", () => ({
  __esModule: true,
  ...reviewController,
}))

const request = (await import("supertest")).default
const jwt = (await import("jsonwebtoken")).default
const { default: app } = await import("../../app.js")

const userToken = jwt.sign({ id: "user-1", email: "user@example.com", role: "user" }, process.env.JWT_SECRET, { expiresIn: "2h" })
const adminToken = jwt.sign({ id: "admin-1", email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" })

describe("⭐ REVIEWS ENDPOINTS", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/products/:productId/reviews - Obtener reviews de un producto", () => {
    test("es público y devuelve lista de reviews", async () => {
      const res = await request(app).get("/api/products/test-product/reviews")

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe("POST /api/products/:productId/reviews - Crear review", () => {
    test("requiere autenticación", async () => {
      const res = await request(app)
        .post("/api/products/test-product/reviews")
        .send({ rating: 7, comment: "Excelente producto" })

      expect([401, 403]).toContain(res.statusCode)
      expect(res.body.ok).toBe(false)
      expect(res.body).toHaveProperty("error")
    })

    test("crea review con usuario autenticado", async () => {
      const res = await request(app)
        .post("/api/products/test-product/reviews")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 8, comment: "Muy bueno" })

      expect(res.statusCode).toBe(201)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.rating).toBe(8)
      expect(res.body.data.comment).toBe("Muy bueno")
    })

    test("valida que productId sea obligatorio", async () => {
      const res = await request(app)
        .post("/api/products//reviews")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 7, comment: "Prueba" })

      expect([400, 404]).toContain(res.statusCode)
    })
  })

  describe("PUT /api/reviews/:id - Actualizar review", () => {
    test("requiere autenticación", async () => {
      const res = await request(app)
        .put("/api/reviews/review-1")
        .send({ rating: 9, comment: "Actualizado" })

      expect([401, 403]).toContain(res.statusCode)
    })

    test("deniega acceso a usuario normal (requiere admin)", async () => {
      const res = await request(app)
        .put("/api/reviews/review-1")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 9, comment: "Intento de actualización" })

      // La ruta tiene requireRole("admin"), por eso un user normal recibe 403
      expect(res.statusCode).toBe(403)
    })

    test("admin puede actualizar cualquier review", async () => {
      const res = await request(app)
        .put("/api/reviews/review-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rating: 5, comment: "Actualizado por admin" })

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.rating).toBe(5)
    })

    test("devuelve 403 si intenta actualizar sin rol admin", async () => {
      const res = await request(app)
        .put("/api/reviews/nonexistent")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 7 })

      // La ruta tiene requireRole("admin"), user normal siempre recibe 403
      expect(res.statusCode).toBe(403)
    })
  })

  describe("DELETE /api/reviews/:id - Eliminar review", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).delete("/api/reviews/review-1")

      expect([401, 403]).toContain(res.statusCode)
    })

    test("deniega acceso a usuario normal (requiere admin)", async () => {
      const res = await request(app)
        .delete("/api/reviews/review-1")
        .set("Authorization", `Bearer ${userToken}`)

      // La ruta tiene requireRole("admin"), por eso un user normal recibe 403
      expect(res.statusCode).toBe(403)
    })

    test("admin puede eliminar cualquier review", async () => {
      const res = await request(app)
        .delete("/api/reviews/review-1")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.message).toMatch(/eliminada/i)
    })

    test("devuelve 403 si intenta eliminar sin rol admin", async () => {
      const res = await request(app)
        .delete("/api/reviews/nonexistent")
        .set("Authorization", `Bearer ${userToken}`)

      // La ruta tiene requireRole("admin"), user normal siempre recibe 403
      expect(res.statusCode).toBe(403)
    })
  })
})
