const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer");
const path = require("path");
const authRoute = require("./routes/user");
const productRoute = require("./routes/product");
const categoryRoute = require("./routes/category");
const sessionRoute = require("./routes/session");

const app = express();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Category API",
      version: "1.0.0",
      description: "API for managing product categories",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", 
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "index.js"],
};

const openapiSpecification = swaggerJsdoc(options);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Rasm yuklash
 *     description: Foydalanuvchi rasm yuklaydi va unga URL qaytariladi.
 *     tags:
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Yuklanayotgan rasm fayli
 *     responses:
 *       200:
 *         description: Fayl muvaffaqiyatli yuklandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "http://localhost:3000/image/example.png"
 */

app.use("/upload", upload.single("image"), (req, res) => {
  res.send({ url: `http://localhost:3000/image/${req.file.filename}` });
});

app.use(express.json());
app.use("/image", express.static("uploads"));
app.use("/auth", authRoute);
app.use("/products", productRoute);
app.use("/category", categoryRoute);
app.use("/session", sessionRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

async function startServer() {
  try {
    app.listen(3000, () => {
      console.log("Server started on port http://localhost:3000/api-docs/");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
