import prisma from "../config/prismaClient.js";
import cloudinary from "../config/cloudinary.js";

export const getAllProducts = async () => {
  return await prisma.product.findMany();
};

export const getProductById = async (id) => {
  return await prisma.product.findUnique({
    where: { id }
  });
};

export const createProduct = async (data, file) => {
  let imageUrl = data.imageUrl || null;

  // Si viene un archivo, lo subimos a Cloudinary primero
  if (file) {
    const uploadResult = await uploadImage(file);
    imageUrl = uploadResult.secure_url; // Extraemos la URL segura (HTTPS) provista por Cloudinary
  }

  return await prisma.product.create({
    data: {
      name: data.name,
      // Convertimos el precio a float (en caso de que venga como cadena desde un formulario)
      price: data.price ? parseFloat(data.price) : 0,
      description: data.description || null,
      // Convertimos el stock a entero en base 10
      stock: data.stock ? parseInt(data.stock, 10) : 0,
      imageUrl: imageUrl
    }
  });
};

export const updateProduct = async (id, data, file) => {
  // Lista de campos permitidos en la actualización para evitar inserciones maliciosas
  const allowedFields = ["name", "price", "description", "stock"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (field in data) {
      // Parsear campos numéricos si vienen en el payload para evitar errores de tipo en la BD
      if (field === "price") updateData[field] = parseFloat(data[field]);
      else if (field === "stock") updateData[field] = parseInt(data[field], 10);
      else updateData[field] = data[field];
    }
  });

  // Si se envía una nueva imagen para actualizar
  if (file) {
    const uploadResult = await uploadImage(file);
    updateData.imageUrl = uploadResult.secure_url;
  }

  // Realizamos la actualización en la BD. El error se propaga hacia el controlador.
  return await prisma.product.update({
    where: { id },
    data: updateData
  });
};

export const deleteProduct = async (id) => {
  // Ejecutamos la consulta DELETE. Si el ID no existe, Prisma lanzará error P2025.
  return await prisma.product.delete({
    where: { id }
  });
};

export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    // Creamos un stream de subida configurando la carpeta destino en Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

export const productsService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};