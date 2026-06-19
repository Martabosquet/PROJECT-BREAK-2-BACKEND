//CON PRISMA
import prisma from "../config/prismaClient.js"

export const getAllProducts = async () => {
  return await prisma.product.findMany();  // Busca todos los productos en la base de datos de Supabase
};

export const getProductById = async (id) => {
  return await prisma.product.findUnique({  // Busca un producto por su clave primaria (ID)
    where: { id }
  });
};

export const createProduct = async (data) => {
  return await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      stock: data.stock,
      imageUrl: data.imageUrl
    }
  });
};

export const updateProduct = async (id, data) => {
  const allowedFields = ["name", "price", "description", "stock", "imageUrl"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (field in data) {
      updateData[field] = data[field];
    }
  });

  try {
    return await prisma.product.update({  // Actualiza el producto que coincida con el ID
      where: { id },
      data: updateData
    });
  } catch (error) {
    return null;  // Si Prisma no encuentra el registro al intentar actualizarlo, arrojará un error
  }
};

export const deleteProduct = async (id) => {
  try {
    await prisma.product.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    return false;
  }
};


export const productsService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}
