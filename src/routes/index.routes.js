//ESTA RUTA SE ENCARGA DE COMPROBAR QUE LA API ESTÁ FUNCIONANDO CORRECTAMENTE

import express from 'express';

const router = express.Router()

//Ruta de health check -> para comprobar que el servidor está funcionando
router.get("/health", (req, res) => {
    res.json({
        ok: true, message: "API funcionando correctamente",
        data: { status: "up" },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    })
})

export default router

