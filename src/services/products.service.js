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

// 1. Modificado para recibir el archivo de imagen opcional
export const createProduct = async (data, file) => {
  let imageUrl = data.imageUrl || null;

  // Si viene un archivo, lo subimos a Cloudinary primero
  if (file) {
    const uploadResult = await uploadImage(file);
    imageUrl = uploadResult.secure_url;
  }

  return await prisma.product.create({
    data: {
      name: data.name,
      // 2. Parsear strings a números por si vienen de un formulario formData
      price: data.price ? parseFloat(data.price) : 0,
      description: data.description || null,
      stock: data.stock ? parseInt(data.stock, 10) : 0,
      imageUrl: imageUrl
    }
  });
};

export const updateProduct = async (id, data, file) => {
  const allowedFields = ["name", "price", "description", "stock"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (field in data) {
      // Parsear campos numéricos si vienen en el update
      if (field === "price") updateData[field] = parseFloat(data[field]);
      else if (field === "stock") updateData[field] = parseInt(data[field], 10);
      else updateData[field] = data[field];
    }
  });

  // Si también se quiere actualizar la imagen
  if (file) {
    const uploadResult = await uploadImage(file);
    updateData.imageUrl = uploadResult.secure_url;
  }

  // 3. Quitamos el try/catch de aquí para que el controlador 
  // pueda capturar el error de Prisma de manera centralizada.
  return await prisma.product.update({
    where: { id },
    data: updateData
  });
};

export const deleteProduct = async (id) => {
  // Dejamos que el error fluya hacia el controlador para que detecte el código "P2025"
  return await prisma.product.delete({
    where: { id }
  });
};

export function uploadImage(file) {
  return new Promise((resolve, reject) => {
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