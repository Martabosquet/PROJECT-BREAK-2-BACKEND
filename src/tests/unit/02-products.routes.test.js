process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

import { jest } from "@jest/globals"

const productsController = {
  getProducts: jest.fn((req, res) => res.json({ ok: true, data: [] })),
  getProductById: jest.fn((req, res) => res.json({ ok: true, data: { id: req.params.id } })),
  createProduct: jest.fn((req, res) => res.status(201).json({ ok: true, data: { id: "new-product" } })),
  updateProduct: jest.fn((req, res) => res.json({ ok: true, data: { id: req.params.id } })),
  deleteProduct: jest.fn((req, res) => res.json({ ok: true, message: "Producto eliminado" })),
}

await jest.unstable_mockModule("../../controllers/products.controller.js", () => ({
  __esModule: true,
  productsController,
}))

const request = (await import("supertest")).default
const jwt = (await import("jsonwebtoken")).default
const { default: app } = await import("../../app.js")

const adminToken = jwt.sign({ id: "admin-1", email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" })
const userToken = jwt.sign({ id: "user-1", email: "user@example.com", role: "user" }, process.env.JWT_SECRET, { expiresIn: "2h" })

describe("📦 PRODUCTS ENDPOINTS", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/products - Listar productos", () => {
    test("es público y devuelve lista de productos", async () => {
      const res = await request(app).get("/api/products")

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(productsController.getProducts).toHaveBeenCalled()
    })
  })

  describe("GET /api/products/:id - Obtener producto por ID", () => {
    test("devuelve producto específico", async () => {
      const res = await request(app).get("/api/products/prod-123")

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("prod-123")
    })
  })

  describe("POST /api/products - Crear producto", () => {
    test("deniega acceso sin token", async () => {
      const res = await request(app)
        .post("/api/products")
        .field("name", "Producto prueba")
        .field("price", "15")
        .field("stock", "5")
        .attach("image", Buffer.from("image"), "product.jpg")

      expect([401, 403]).toContain(res.statusCode)
    })

    test("deniega acceso a usuario sin rol admin", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${userToken}`)
        .field("name", "Producto prueba")
        .field("price", "15")
        .field("stock", "5")
        .attach("image", Buffer.from("image"), "product.jpg")

      expect(res.statusCode).toBe(403)
    })

    test("permite a admin crear producto", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Producto prueba")
        .field("price", "15")
        .field("stock", "5")
        .attach("image", Buffer.from("image"), "product.jpg")

      expect(res.statusCode).toBe(201)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("new-product")
    })
  })

  describe("PUT /api/products/:id - Actualizar producto", () => {
    test("deniega acceso sin token", async () => {
      const res = await request(app)
        .put("/api/products/abc")
        .field("name", "Producto editado")
        .attach("image", Buffer.from("image"), "product.jpg")

      expect([401, 403]).toContain(res.statusCode)
    })

    test("permite a admin actualizar", async () => {
      const res = await request(app)
        .put("/api/products/abc")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Producto editado")
        .attach("image", Buffer.from("image"), "product.jpg")

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("abc")
    })
  })

  describe("DELETE /api/products/:id - Eliminar producto", () => {
    test("deniega acceso a usuario normal", async () => {
      const res = await request(app)
        .delete("/api/products/abc")
        .set("Authorization", `Bearer ${userToken}`)

      expect(res.statusCode).toBe(403)
    })

    test("permite a admin eliminar", async () => {
      const res = await request(app)
        .delete("/api/products/abc")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.message).toMatch(/eliminado/i)
    })
  })
})
