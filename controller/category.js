const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  categoryValidation,
  categoryValidationUpdate,
} = require("../validation/category");

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { error } = categoryValidation(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!name) {
      return res.status(400).json({ error: "Name is required!" });
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: "Error!", message: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { search, sortOrder = "asc", page = 1, limit = 10 } = req.query;

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: sortOrder },
      skip,
      take,
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found!" });
    }

    res.json(category);
  } catch (error) {
    return res.status(500).json({ error: "Error!", message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { error } = categoryValidationUpdate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!name) {
      return res.status(400).json({ error: "Name is required!" });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json(updatedCategory);
  } catch (error) {
    return res.status(500).json({ error: "Error!", message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
