process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

import { jest } from "@jest/globals"

const cartController = {
  getCartController: jest.fn((req, res) => res.json({ ok: true, data: { items: [] } })),
  addItemController: jest.fn((req, res) => res.status(201).json({ ok: true, data: { id: "cart-item-1" } })),
  removeItemController: jest.fn((req, res) => res.json({ ok: true, message: "Elemento eliminado" })),
  decreaseItemQuantityController: jest.fn((req, res) => res.json({ ok: true, data: { id: "cart-item-1", quantity: 1 } })),
  checkoutController: jest.fn((req, res) => res.json({ ok: true, data: { id: "order-1" } })),
  getOrdersController: jest.fn((req, res) => res.json({ ok: true, data: [] })),
  getOrderByIdController: jest.fn((req, res) => res.json({ ok: true, data: { id: req.params.orderId } })),
}

await jest.unstable_mockModule("../../controllers/cart.controller.js", () => ({
  __esModule: true,
  ...cartController,
}))

const request = (await import("supertest")).default
const jwt = (await import("jsonwebtoken")).default
const { default: app } = await import("../../app.js")

const token = jwt.sign({ id: "user-1", email: "user@example.com", role: "user" }, process.env.JWT_SECRET, { expiresIn: "2h" })

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

  describe("POST /api/cart/checkout - Realizar compra", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).post("/api/cart/checkout")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("crea orden con token válido", async () => {
      const res = await request(app)
        .post("/api/cart/checkout")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("order-1")
    })
  })

  describe("GET /api/orders - Historial de pedidos del usuario", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).get("/api/orders")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("devuelve lista de órdenes con token válido", async () => {
      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(cartController.getOrdersController).toHaveBeenCalled()
    })
  })

  describe("GET /api/orders/:orderId - Obtener pedido por ID", () => {
    test("requiere autenticación", async () => {
      const res = await request(app).get("/api/orders/order-1")
      expect([401, 403]).toContain(res.statusCode)
    })

    test("devuelve la orden con token válido", async () => {
      const res = await request(app)
        .get("/api/orders/order-1")
        .set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body.data.id).toBe("order-1")
      expect(cartController.getOrderByIdController).toHaveBeenCalled()
    })
  })
})
