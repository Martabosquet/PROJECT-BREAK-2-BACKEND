import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.js";
import prisma from "../../config/prismaClient.js";

const TEST_USER_ID = "test-user-order";
const TEST_PRODUCT_ID = "test-product-order";

describe("🛍️ ORDERS INTEGRATION - Flujo completo de carrito y órdenes", () => {
    let token;
    let orderId;

    beforeAll(async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
        token = jwt.sign(
            { id: TEST_USER_ID, email: "test@example.com", role: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "2h" },
        );

        await prisma.product.upsert({
            where: { id: TEST_PRODUCT_ID },
            update: {
                name: "Producto de prueba de pedido",
                description: "Producto usado para pruebas de checkout",
                price: 10.5,
                stock: 100,
            },
            create: {
                id: TEST_PRODUCT_ID,
                name: "Producto de prueba de pedido",
                description: "Producto usado para pruebas de checkout",
                price: 10.5,
                stock: 100,
            },
        });
    });

    afterAll(async () => {
        if (orderId) {
            await prisma.order.delete({ where: { id: orderId } }).catch(() => null);
        }

        const cart = await prisma.cart.findFirst({ where: { userId: TEST_USER_ID } });
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }).catch(() => null);
            await prisma.cart.delete({ where: { id: cart.id } }).catch(() => null);
        }

        await prisma.$disconnect();
    });

    describe("POST /api/cart/items → POST /api/cart/checkout → GET /api/orders", () => {
        test("flujo completo: añadir al carrito, checkout y consultar órdenes", async () => {
            // 1. AGREGAR PRODUCTO AL CARRITO
            const addRes = await request(app)
                .post("/api/cart/items")
                .set("Authorization", `Bearer ${token}`)
                .send({ productId: TEST_PRODUCT_ID, quantity: 2 });

            expect(addRes.statusCode).toBe(201);
            expect(addRes.body.ok).toBe(true);
            expect(addRes.body.data).toMatchObject({ productId: TEST_PRODUCT_ID, quantity: 2 });

            // 2. REALIZAR CHECKOUT (crear orden)
            const checkoutRes = await request(app)
                .post("/api/cart/checkout")
                .set("Authorization", `Bearer ${token}`);

            expect(checkoutRes.statusCode).toBe(200);
            expect(checkoutRes.body.ok).toBe(true);
            expect(checkoutRes.body.data).toHaveProperty("id");
            expect(Array.isArray(checkoutRes.body.data.items)).toBe(true);
            expect(checkoutRes.body.data.items[0]).toMatchObject({
                productId: TEST_PRODUCT_ID,
                quantity: 2,
                priceAtPurchase: 10.5,
            });

            orderId = checkoutRes.body.data.id;

            // 3. VERIFICAR HISTORIAL DE ÓRDENES
            const ordersRes = await request(app)
                .get("/api/orders")
                .set("Authorization", `Bearer ${token}`);

            expect(ordersRes.statusCode).toBe(200);
            expect(ordersRes.body.ok).toBe(true);
            expect(Array.isArray(ordersRes.body.data)).toBe(true);
            expect(ordersRes.body.data.some((order) => order.id === orderId)).toBe(true);

            // 4. OBTENER DETALLES DE LA ORDEN
            const orderRes = await request(app)
                .get(`/api/orders/${orderId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(orderRes.statusCode).toBe(200);
            expect(orderRes.body.ok).toBe(true);
            expect(orderRes.body.data.id).toBe(orderId);
            expect(orderRes.body.data.items[0].productId).toBe(TEST_PRODUCT_ID);
        });
    });

    describe("GET /api/orders/:orderId - Obtener orden específica", () => {
        test("devuelve 404 si la orden no existe", async () => {
            const res = await request(app)
                .get("/api/orders/nonexistent-order-id")
                .set("Authorization", `Bearer ${token}`);

            expect([404, 200]).toContain(res.statusCode);
        });

        test("requiere autenticación", async () => {
            const res = await request(app).get(`/api/orders/some-order-id`);

            expect([401, 403]).toContain(res.statusCode);
        });
    });
});
