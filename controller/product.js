const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  productValidation,
  productValidationUpdate,
} = require("../validation/product");

const createProduct = async (req, res) => {
  try {
    const { name, price, categoryId } = req.body;
    const { error } = productValidation(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!name || !price || !categoryId) {
      return res
        .status(400)
        .json({ error: "Name, price and categoryId are required!" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price,
        categoryId,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const {
      categoryId,
      minPrice,
      maxPrice,
      search,
      sortBy = "name",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (categoryId) where.categoryId = categoryId;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy,
      skip,
      take,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId } = req.body;
    const { error } = productValidationUpdate(req.body);

    const productExists = await prisma.product.findUnique({
      where: { id },
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!productExists) {
      return res.status(404).json({ error: "Product not found!" });
    }

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!categoryExists) {
        return res.status(400).json({ error: "Category does not exist!" });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        price,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const productExists = await prisma.product.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ error: "Product not found!" });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Product deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
