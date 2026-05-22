//PUNTO 2: AQUÍ SOLO SE DEFINE LA APP: SE ENCARGA DE CONFIGURAR EL SERVIDOR, LOS MIDDLEWARES Y LAS RUTAS

import express from 'express';
import productRouter from './routes/products.routes.js';
import indexRouter from './routes/index.routes.js';

const app = express();

app.use(express.json()) // le dice a express que entienda JSON
app.use(express.urlencoded({ extended: true })) // Analiza cuerpos de peticiones POST


app.use("/", productRouter) //o se lo pongo aquí /api/products o se lo pongo en routes directamente, yo he decidido ponérselo en routes directamente
app.use("/", indexRouter)

export default app