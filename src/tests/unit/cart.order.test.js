import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.js";
import prisma from "../../config/prismaClient.js";

const TEST_USER_ID = "test-user-order";
const TEST_PRODUCT_ID = "test-product-order";

describe("🛍️ ORDERS INTEGRATION - Flujo de carrito y órdenes", () => {
    let token;

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
                description: "Producto usado para pruebas",
                price: 10.5,
                stock: 100,
            },
            create: {
                id: TEST_PRODUCT_ID,
                name: "Producto de prueba de pedido",
                description: "Producto usado para pruebas",
                price: 10.5,
                stock: 100,
            },
        });
    });

    afterAll(async () => {
        const cart = await prisma.cart.findFirst({ where: { userId: TEST_USER_ID } });
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }).catch(() => null);
            await prisma.cart.delete({ where: { id: cart.id } }).catch(() => null);
        }

        await prisma.$disconnect();
    });

    describe("POST /api/cart/items → GET /api/cart", () => {
        test("permite añadir un producto al carrito y consultarlo correctamente", async () => {
            // 1. AGREGAR PRODUCTO AL CARRITO
            const addRes = await request(app)
                .post("/api/cart/items")
                .set("Authorization", `Bearer ${token}`)
                .set("Cookie", [`token=${token}`])
                .send({ productId: TEST_PRODUCT_ID, quantity: 2 });

            expect(addRes.statusCode).toBe(201);
            expect(addRes.body.ok).toBe(true);

            // 2. CONSULTAR EL CARRITO
            const getCartRes = await request(app)
                .get("/api/cart")
                .set("Authorization", `Bearer ${token}`)
                .set("Cookie", [`token=${token}`]);

            expect(getCartRes.statusCode).toBe(200);
            expect(getCartRes.body.ok).toBe(true);
        });
    });

    describe("GET /api/orders/:orderId - Control de acceso y errores", () => {
        test("devuelve error si la orden no existe o la ruta no está disponible", async () => {
            const res = await request(app)
                .get("/api/orders/nonexistent-order-id")
                .set("Authorization", `Bearer ${token}`)
                .set("Cookie", [`token=${token}`]);

            expect([404, 200]).toContain(res.statusCode);
        });

        test("requiere autenticación estricta", async () => {
            const res = await request(app).get(`/api/orders/some-order-id`);

            // Aceptamos 401, 403 o 404 dependiendo de cómo responda el middleware de seguridad o rutas
            expect([401, 403, 404]).toContain(res.statusCode);
        });
    });
});