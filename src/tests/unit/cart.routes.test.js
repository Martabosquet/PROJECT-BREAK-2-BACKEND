process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

import { jest } from "@jest/globals"

const cartController = {
  getCartController: jest.fn((req, res) => res.json({ ok: true, data: { items: [] } })),
  getCartByIdController: jest.fn((req, res) => res.json({ ok: true, data: { id: req.params.cartId } })),
  addItemController: jest.fn((req, res) => res.status(201).json({ ok: true, data: { id: "cart-item-1" } })),
  removeItemController: jest.fn((req, res) => res.json({ ok: true, message: "Elemento eliminado" })),
  decreaseItemQuantityController: jest.fn((req, res) => res.json({ ok: true, data: { id: "cart-item-1", quantity: 1 } })),
}

await jest.unstable_mockModule("../../controllers/cart.controller.js", () => ({
  __esModule: true,
  ...cartController,
}))

const request = (await import("supertest")).default
const jwt = (await import("jsonwebtoken")).default
const { default: app } = await import("../../app.js")

const token = jwt.sign({ id: "user-1", email: "user@example.com", role: "user" }, process.env.JWT_SECRET, { expiresIn: "2h" })
const adminToken = jwt.sign({ id: "admin-1", email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" })

describe("🛒 CART ENDPOINTS", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/cart - Obtener carrito", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).get("/api/cart")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("devuelve carrito con token válido", async () => {
      const res = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
    })
  })

  describe("POST /api/cart/items - Añadir producto al carrito", () => {
    test("requiere autenticación", async () => {
      const res = await request(app)
        .post("/api/cart/items")
        .send({ productId: "test-product", quantity: 1 })

      expect([401, 403]).toContain(res.statusCode)
    })

    test("agrega item con token válido", async () => {
      const res = await request(app)
        .post("/api/cart/items")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: "test-product", quantity: 1 })

      expect(res.statusCode).toBe(201)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("cart-item-1")
    })
  })

  describe("PATCH /api/cart/items/:itemId - Disminuir cantidad", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).patch("/api/cart/items/cart-item-1").send({ quantity: 1 })
      expect([401, 403]).toContain(res.statusCode)
    })

    test("disminuye cantidad con token válido", async () => {
      const res = await request(app)
        .patch("/api/cart/items/cart-item-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 1 })

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.quantity).toBe(1)
    })
  })

  describe("DELETE /api/cart/items/:itemId - Eliminar item del carrito", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).delete("/api/cart/items/cart-item-1")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("elimina item con token válido", async () => {
      const res = await request(app)
        .delete("/api/cart/items/cart-item-1")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.message).toMatch(/eliminado/i)
    })
  })

  describe("GET /api/carts/:cartId - Obtener carrito por id (solo admin)", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).get("/api/carts/cart-1")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("rechaza a un usuario sin rol admin", async () => {
      const res = await request(app)
        .get("/api/carts/cart-1")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(403)
    })

    test("devuelve el carrito con token de admin", async () => {
      const res = await request(app)
        .get("/api/carts/cart-1")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("cart-1")
      expect(cartController.getCartByIdController).toHaveBeenCalled()
    })
  })
})