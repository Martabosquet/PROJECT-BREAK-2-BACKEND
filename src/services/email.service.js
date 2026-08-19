// services/email.service.js
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false, // solo para desarrollo local
    },
})

export const sendOrderConfirmationEmail = async (order, customerEmail, customerName) => {
    const itemsHtml = order.items
        .map((item) => `
            <tr>
                <td style="padding: 8px 0;">${item.product?.name ?? "Producto"}</td>
                <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px 0; text-align: right;">${Number(item.priceAtPurchase).toFixed(2)} €</td>
            </tr>
        `)
        .join("")

    const html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: auto;">
            <h1 style="color: #1f2933;">¡Gracias por tu pedido, ${customerName}!</h1>
            <p style="color: #64748b;">Hemos confirmado tu pago y estamos preparando tu pedido.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #e7dfd5;">
                        <th style="text-align: left; padding-bottom: 8px;">Película</th>
                        <th style="text-align: center; padding-bottom: 8px;">Cantidad</th>
                        <th style="text-align: right; padding-bottom: 8px;">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <p style="font-size: 1.2rem; font-weight: bold; text-align: right;">
                Total: ${Number(order.total).toFixed(2)} €
            </p>

            <h3 style="color: #1f2933;">Dirección de envío</h3>
            <p style="color: #64748b;">
                ${order.street}<br />
                ${order.city}, ${order.postalCode}<br />
                ${order.country}
            </p>

            <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 32px;">
                Pedido #${order.id}
            </p>
        </div>
    `

    try {
        await transporter.sendMail({
            from: `"Atxurre CineClub" <${process.env.GMAIL_USER}>`,
            to: customerEmail,
            subject: `Confirmación de tu pedido #${order.id.slice(0, 8)}`,
            html,
        })
    } catch (error) {
        console.error("Error enviando email de confirmación:", error)
    }
}