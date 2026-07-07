# 🛒 E-Commerce Backend — Documentación del proyecto

Este proyecto es un backend REST para un e-commerce construido con Node.js, Express 5 y ESM. Está diseñado para ser consumido por un frontend moderno y ofrece:

- Autenticación JWT con `Authorization: Bearer` y cookies HTTP-only
- Roles de usuario (`user`, `admin`) con protecciones de autorización
- Gestión de productos con subida de imágenes vía `multer` y Cloudinary
- Carrito de compra y checkout con historial de pedidos
- Reviews de productos y lista de deseos (`wishlist`)
- Documentación de API con Swagger en `/api/docs`

---

## 📌 Tecnologías principales

- Node.js + Express 5
- ECMAScript Modules (ESM)
- JWT con `jsonwebtoken`
- Prisma + PostgreSQL para productos, carrito, pedidos y usuarios
- MongoDB / Mongoose para reviews y wishlist
- `multer` para subida de imágenes
- `helmet`, `cors`, `express-rate-limit` para seguridad
- `swagger-ui-express` para documentación de API
- `jest` + `supertest` para pruebas

---

## 🚀 Cómo ejecutar el proyecto

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Configura las variables de entorno necesarias (`.env`):
   - `PORT`
   - `JWT_SECRET`
   - `DATABASE_URL` para Prisma/PostgreSQL (o `DIRECT_URL`)
   - `MONGODB_URI` para MongoDB
   - `CLOUDINARY_*` si usas Cloudinary para imágenes

3. Arranca el servidor:
   ```bash
   npm start
   ```

4. Abre la documentación Swagger en:
   ```text
   http://localhost:3000/api/docs
   ```

---

## 🧪 Pruebas

Ejecuta todos los tests con:

```bash
npm test
```

El proyecto incluye pruebas unitarias y de integración con `jest` y `supertest`.

---

## 🌐 Endpoints disponibles

### Salud del servidor

- `GET /health`
  - Verifica que la API está activa
  - Respuesta: `{ ok: true, data: { status: 'up' }, uptime, timestamp }`

### Documentación

- `GET /api/docs`
  - Interfaz Swagger para navegar y probar la API.

### Autenticación

- `POST /api/auth/register`
  - Registra un nuevo usuario.
  - Body:
    - `email` (string, obligatorio)
    - `password` (string, obligatorio)
    - `role` (string, opcional, `user` o `admin` por defecto `user`)
  - Respuesta: usuario creado.

- `POST /api/auth/login`
  - Inicia sesión y devuelve una cookie HTTP-only con el JWT.
  - Body:
    - `email` (string, obligatorio)
    - `password` (string, obligatorio)
  - Respuesta: mensaje de éxito.

- `POST /api/auth/logout`
  - Cierra sesión limpiando la cookie de token.
  - Respuesta: mensaje de sesión cerrada.

- `GET /api/me`
  - Devuelve el perfil del usuario autenticado.
  - Requiere `Authorization: Bearer <token>` o cookie `token`.

- `GET /api/admin`
  - Acceso exclusivo para usuarios con rol `admin`.
  - Requiere autenticación y rol.

---

## 🛍️ Productos

- `GET /api/products`
  - Lista todos los productos disponibles.
  - Público.

- `GET /api/products/:id`
  - Obtiene un producto por su `id`.
  - Público.

- `POST /api/products`
  - Crea un nuevo producto.
  - Requiere rol `admin`.
  - Middleware:
    - `authMiddleware`
    - `requireRole('admin')`
    - `upload.single('image')`
    - `validateProduct`
  - Body multipart/form-data:
    - `name` (string)
    - `description` (string)
    - `price` (number)
    - `stock` (number)
    - `image` (archivo)

- `PUT /api/products/:id`
  - Actualiza un producto existente.
  - Requiere rol `admin`.
  - Puede incluir una nueva imagen.

- `DELETE /api/products/:id`
  - Elimina un producto.
  - Requiere rol `admin`.

---

## ⭐ Reviews de productos

- `GET /api/products/:productId/reviews`
  - Obtiene todas las reviews de un producto.
  - Público.

- `POST /api/products/:productId/reviews`
  - Crea una review para un producto.
  - Requiere autenticación.
  - Body:
    - `rating` (number)
    - `comment` (string opcional)

- `PUT /api/reviews/:id`
  - Actualiza una review existente.
  - Requiere autenticación y solo el creador de la review o un admin puede hacerlo.

- `DELETE /api/reviews/:id`
  - Elimina una review.
  - Requiere autenticación y solo el creador o un admin.

---

## 💖 Wishlist

- `GET /api/wishlist`
  - Obtiene la wishlist del usuario autenticado.
  - Requiere autenticación.

- `POST /api/wishlist/:productId`
  - Añade un producto a la wishlist del usuario.
  - Requiere autenticación.

- `DELETE /api/wishlist/:id`
  - Elimina un elemento de wishlist.
  - Requiere rol `admin`.

---

## 🛒 Carrito y pedidos

- `GET /api/cart`
  - Muestra el carrito del usuario autenticado.
  - Requiere autenticación.

- `POST /api/cart/items`
  - Añade un producto al carrito.
  - Requiere autenticación.
  - Body:
    - `productId` (string)
    - `quantity` (number)

- `DELETE /api/cart/items/:itemId`
  - Elimina un item del carrito.
  - Requiere autenticación.

- `PATCH /api/cart/items/:itemId`
  - Modifica la cantidad de un item en el carrito.
  - Requiere autenticación.
  - Body:
    - `quantity` (number positivo)

- `POST /api/cart/checkout`
  - Realiza checkout del carrito y crea una orden.
  - Requiere autenticación.
  - El servicio genera `Order` junto con los `OrderItem` de cada producto comprado.

- `GET /api/orders`
  - Devuelve el historial de pedidos del usuario autenticado.
  - Requiere autenticación.

- `GET /api/orders/:orderId`
  - Recupera una orden específica del usuario.
  - Requiere autenticación.

---

## 🔐 Autorización y roles

- Las rutas de creación, edición y borrado están protegidas para `admin`.
- El endpoint `/api/admin` está reservado para `admin`.

---

## 📁 Estructura principal

```text
src/
├── config/        # Conexiones a bases de datos (Prisma y Mongoose) y Cloudinary
├── controllers/   # Procesamiento de peticiones y respuestas HTTP unificadas
├── middlewares/   # Validadores, autenticación (JWT/RBAC) y manejador global de errores
├── models/        # Esquemas de Mongoose para MongoDB
├── routes/        # Definición de enrutadores de la API
├── services/      # Lógica de negocio pesada y consultas a bases de datos
├── tests/         # Suite de pruebas automatizadas de endpoints
├── app.js         # Configuración de Express, middlewares globales y tuberías
└── server.js      # Inicialización y arranque del servidor HTTP

---

## 💡 Notas importantes

- La autenticación JWT se guarda en cookie `token` con `httpOnly`.
- También puedes enviar el JWT por header `Authorization: Bearer <token>`.
- La ruta `/api/docs` permite probar los endpoints desde Swagger.
- El checkout crea `Order` y registra los `OrderItem` con el precio de compra actual.
- La protección de roles está implementada con `requireRole('admin')`.
- Errores: el stack trace solo se expone en `NODE_ENV=development`; en producción solo se devuelve el mensaje.

---

## 🧩 Comandos útiles

- `npm install` — instala dependencias.
- `npm start` — levanta el servidor.
- `npm test` — ejecuta pruebas con Jest.