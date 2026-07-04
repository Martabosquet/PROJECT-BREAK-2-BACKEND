import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.js";
import prisma from "../../config/prismaClient.js";

const TEST_USER_ID = "test-user-stock";
const TEST_PRODUCT_ID = "test-product-stock";
const PRODUCT_STOCK = 5;

describe("📦 CART STOCK - No se puede añadir más cantidad de la que hay en stock", () => {
    let token;

    beforeAll(async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

        token = jwt.sign(
            { id: TEST_USER_ID, email: "test-stock@example.com", role: "user" },
            process.env.JWT_SECRET,
            { expiresIn: "2h" },
        );

        // Producto con stock limitado y conocido para poder comprobar el límite exacto
        await prisma.product.upsert({
            where: { id: TEST_PRODUCT_ID },
            update: {
                name: "Producto de prueba de stock",
                description: "Producto usado para pruebas de límite de stock",
                price: 5,
                stock: PRODUCT_STOCK,
            },
            create: {
                id: TEST_PRODUCT_ID,
                name: "Producto de prueba de stock",
                description: "Producto usado para pruebas de límite de stock",
                price: 5,
                stock: PRODUCT_STOCK,
            },
        });
    });

    afterEach(async () => {
        // Limpiamos el carrito del usuario de prueba entre tests para que
        // cada uno empiece con el carrito vacío y no arrastre cantidades
        const cart = await prisma.cart.findFirst({ where: { userId: TEST_USER_ID } });
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }).catch(() => null);
            await prisma.cart.delete({ where: { id: cart.id } }).catch(() => null);
        }
    });

    afterAll(async () => {
        await prisma.product.delete({ where: { id: TEST_PRODUCT_ID } }).catch(() => null);
        await prisma.$disconnect();
    });

    test("permite añadir una cantidad igual al stock disponible", async () => {
        const res = await request(app)
            .post("/api/cart/items")
            .set("Authorization", `Bearer ${token}`)
            .send({ productId: TEST_PRODUCT_ID, quantity: PRODUCT_STOCK });

        expect(res.statusCode).toBe(201);
        expect(res.body.ok).toBe(true);
        expect(res.body.data).toMatchObject({
            productId: TEST_PRODUCT_ID,
            quantity: PRODUCT_STOCK,
        });
    });

    test("rechaza añadir una cantidad mayor al stock disponible", async () => {
        const res = await request(app)
            .post("/api/cart/items")
            .set("Authorization", `Bearer ${token}`)
            .send({ productId: TEST_PRODUCT_ID, quantity: PRODUCT_STOCK + 1 });

        expect(res.statusCode).toBe(400);
        expect(res.body.ok).toBe(false);
        expect(res.body.error).toMatch(/stock/i);

        // Confirmamos que no se creó ningún item en el carrito
        const cart = await prisma.cart.findFirst({
            where: { userId: TEST_USER_ID },
            include: { items: true },
        });
        expect(cart?.items.length ?? 0).toBe(0);
    });

    test("rechaza acumular cantidades que en total superen el stock, aunque cada petición sea válida por separado", async () => {
        // 1ª petición: 3 unidades, dentro del stock (5)
        const firstRes = await request(app)
            .post("/api/cart/items")
            .set("Authorization", `Bearer ${token}`)
            .send({ productId: TEST_PRODUCT_ID, quantity: 3 });

        expect(firstRes.statusCode).toBe(201);
        expect(firstRes.body.data.quantity).toBe(3);

        // 2ª petición: 3 unidades más → 3 + 3 = 6, supera el stock (5)
        const secondRes = await request(app)
            .post("/api/cart/items")
            .set("Authorization", `Bearer ${token}`)
            .send({ productId: TEST_PRODUCT_ID, quantity: 3 });

        expect(secondRes.statusCode).toBe(400);
        expect(secondRes.body.ok).toBe(false);
        expect(secondRes.body.error).toMatch(/stock/i);

        // La cantidad en el carrito debe seguir siendo la de la primera petición (3), no 6
        const cart = await prisma.cart.findFirst({
            where: { userId: TEST_USER_ID },
            include: { items: true },
        });
        expect(cart.items[0].quantity).toBe(3);
    });

    test("devuelve 404 si el producto no existe", async () => {
        const res = await request(app)
            .post("/api/cart/items")
            .set("Authorization", `Bearer ${token}`)
            .send({ productId: "producto-inexistente", quantity: 1 });

        expect(res.statusCode).toBe(404);
        expect(res.body.ok).toBe(false);
    });
});