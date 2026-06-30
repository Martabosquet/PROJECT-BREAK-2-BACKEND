import request from "supertest";
import app from "../../../src/app.js"; // Importamos la app sin levantar el servidor físico

describe("Pruebas del módulo de Productos", () => {

    test("GET /api/products debería devolver un estado 200", async () => {
        const res = await request(app).get("/api/products");

        expect(res.statusCode).toBe(200); // Comprobamos que el código de estado sea exitoso
    });
});