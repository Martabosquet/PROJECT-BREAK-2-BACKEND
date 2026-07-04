import { jest } from "@jest/globals"
import { errorHandler } from "../../middlewares/errorHandler.js"

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe("errorHandler middleware", () => {
    let res
    const req = {}
    const next = jest.fn()

    beforeEach(() => {
        res = buildRes()
        jest.spyOn(console, "error").mockImplementation(() => { })
    })

    afterEach(() => {
        console.error.mockRestore()
    })

    test("usa statusCode y message del error si ya vienen definidos", () => {
        const error = new Error("Recurso no encontrado")
        error.statusCode = 404

        errorHandler(error, req, res, next)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false, error: "Recurso no encontrado", statusCode: 404 }),
        )
    })

    test("usa 500 por defecto si el error no tiene statusCode", () => {
        const error = new Error("Algo inesperado")

        errorHandler(error, req, res, next)

        expect(res.status).toHaveBeenCalledWith(500)
    })

    test("traduce el error P2002 de Prisma a 409 (duplicado)", () => {
        const error = new Error("Unique constraint failed")
        error.code = "P2002"

        errorHandler(error, req, res, next)

        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringMatching(/ya existe/i) }),
        )
    })

    test("traduce el error P2025 de Prisma a 404 (no encontrado)", () => {
        const error = new Error("Record not found")
        error.code = "P2025"

        errorHandler(error, req, res, next)

        expect(res.status).toHaveBeenCalledWith(404)
    })

    test("traduce un CastError de Mongoose a 400 (id inválido)", () => {
        const error = new Error("Cast to ObjectId failed")
        error.name = "CastError"

        errorHandler(error, req, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringMatching(/identificador/i) }),
        )
    })

    test("traduce un ValidationError de Mongoose a 400 con el detalle de los campos", () => {
        const error = new Error("Validation failed")
        error.name = "ValidationError"
        error.errors = {
            rating: { message: "El rating debe estar entre 1 y 10" },
        }

        errorHandler(error, req, res, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringMatching(/rating/i) }),
        )
    })

    test("no incluye el stack trace fuera de development", () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "production"

        errorHandler(new Error("Fallo"), req, res, next)

        const responseBody = res.json.mock.calls[0][0]
        expect(responseBody).not.toHaveProperty("stack")

        process.env.NODE_ENV = originalEnv
    })

    test("incluye el stack trace en development", () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "development"

        errorHandler(new Error("Fallo"), req, res, next)

        const responseBody = res.json.mock.calls[0][0]
        expect(responseBody).toHaveProperty("stack")

        process.env.NODE_ENV = originalEnv
    })
})