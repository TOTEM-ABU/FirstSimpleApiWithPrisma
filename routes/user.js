const express = require("express");
const {
  register,
  verifyOtp,
  login,
  findOne,
  findAll,
  update,
  remove,
  promoteToAdmin,
  getNewAccessToken
} = require("../controller/user");
const authMiddleware = require("../middleware/auth.js");
const roleMiddleware = require("../middleware/roleAuth.js");

const UsersRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: 👥 Users
 *   description: 🌟 API for managing users
 */
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 📝 Register a new user
 *     tags: [👥 Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: 🏷️ The full name of the user
 *               yearOfBirth:
 *                 type: integer
 *                 description: 🎂 The year of birth of the user
 *               email:
 *                 type: string
 *                 description: 📧 The email of the user
 *               password:
 *                 type: string
 *                 description: 🔑 The password of the user
 *               phone:
 *                 type: string
 *                 description: 📱 The phone number of the user
 *               role:
 *                 type: string
 *                 enum: [Admin, User, Ceo, SuperAdmin]
 *                 description: 🎭 The role of the user (default is "User")
 *               avatar:
 *                 type: string
 *                 description: 🖼️ The avatar URL of the user
 *     responses:
 *       200:
 *         description: 🎉 User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: ❌ Bad request. Validation error
 *       405:
 *         description: ⚠️ Account already exists
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.post("/register", register);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: 🔍 Verify OTP for account activation
 *     tags: [👥 Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: 🎉 Account activated successfully
 *       403:
 *         description: ❌ OTP is incorrect
 *       405:
 *         description: ❌ Email is incorrect
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.post("/verify-otp", verifyOtp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 🔑 Login a user
 *     tags: [👥 Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 📧 The email of the user
 *               password:
 *                 type: string
 *                 description: 🔑 The password of the user
 *     responses:
 *       200:
 *         description: 🎉 Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *       403:
 *         description: ⚠️ Account not activated
 *       422:
 *         description: ❌ Invalid email or password
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.post("/login", login);

/**
 * @swagger
 * /auth/get-access-token:
 *   post:
 *     summary: 🔄 Get a new access token using a refresh token
 *     tags: [👥 Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: 🔄 Your refresh token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ✅ New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 access_token:
 *                   type: string
 *       404:
 *         description: ❌ User not found
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.post("/get-access-token", getNewAccessToken);

/**
 * @swagger
 * /auth/promoteToAdmin/{id}:
 *   patch:
 *     summary: ⬆️ Promote a user to admin
 *     tags: [👥 Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 🆔 The ID of the user to promote
 *     responses:
 *       200:
 *         description: 🎉 User promoted to admin successfully
 *       400:
 *         description: ❌ Bad request
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.patch("/promoteToAdmin/:id", promoteToAdmin);

/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: 🔍 Get all users with filters, sorting, and pagination
 *     tags: [👥 Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 🔎 Search by full name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Admin, User, Ceo, SuperAdmin]
 *         description: 🎭 Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: 🟢🔴 Filter by user status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 📄 Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 📊 Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fullName, email, createdAt]
 *         description: 🔼🔽 Field to sort by (e.g., fullName, email, createdAt)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: ⬆️⬇️ Sorting order (asc or desc)
 *     responses:
 *       200:
 *         description: ✅ A list of users with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: ⛔ Unauthorized access
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.get("/", authMiddleware, roleMiddleware(["Admin"]), findAll);

/**
 * @swagger
 * /auth/user/{id}:
 *   get:
 *     summary: 👤 Get a user by ID
 *     tags: [👥 Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 🆔 The ID of the user
 *     responses:
 *       200:
 *         description: ✅ User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: ❌ User not found
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.get("/:id", authMiddleware, roleMiddleware(["Admin"]), findOne);

/**
 * @swagger
 * /auth/user/{id}:
 *   patch:
 *     summary: ✏️ Update a user by ID (Admin or SuperAdmin only)
 *     tags: [👥 Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 🆔 The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: 🏷️ The updated full name of the user
 *               yearOfBirth:
 *                 type: integer
 *                 description: 🎂 The updated year of birth of the user
 *               email:
 *                 type: string
 *                 description: 📧 The updated email of the user
 *               password:
 *                 type: string
 *                 description: 🔑 The updated password of the user
 *               phone:
 *                 type: string
 *                 description: 📱 The updated phone number of the user
 *               role:
 *                 type: string
 *                 enum: [Admin, User, Ceo, SuperAdmin]
 *                 description: 🎭 The updated role of the user
 *               avatar:
 *                 type: string
 *                 description: 🖼️ The updated avatar URL of the user
 *               regionID:
 *                 type: integer
 *                 description: 🌍 The updated ID of the region the user belongs to
 *     responses:
 *       200:
 *         description: ✅ User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: ⛔ Only SuperAdmin can update users
 *       404:
 *         description: ❌ User not found
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "SuperAdmin"]),
  update
);

/**
 * @swagger
 * /auth/user/{id}:
 *   delete:
 *     summary: 🗑️ Delete a user by ID (Admin only)
 *     tags: [👥 Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 🆔 The ID of the user
 *     responses:
 *       200:
 *         description: ✅ User deleted successfully
 *       403:
 *         description: ⛔ Nobody can destroy admin
 *       404:
 *         description: ❌ User not found
 *       500:
 *         description: 🚨 Internal server error
 */
UsersRouter.delete("/:id", authMiddleware, roleMiddleware(["Admin"]), remove);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 🆔 The auto-generated ID of the user
 *         firstName:
 *           type: string
 *           description: 👨‍💼 User's first name
 *         lastName:
 *           type: string
 *           description: 👨‍💼 User's last name
 *         fullName:
 *           type: string
 *           description: 🏷️ The full name of the user
 *         yearOfBirth:
 *           type: integer
 *           description: 🎂 The year of birth of the user
 *         email:
 *           type: string
 *           description: 📧 The email of the user
 *         password:
 *           type: string
 *           description: 🔑 The password of the user
 *         phone:
 *           type: string
 *           description: 📱 The phone number of the user
 *         role:
 *           type: string
 *           enum: [Admin, User, Ceo, SuperAdmin]
 *           description: 🎭 The role of the user
 *         avatar:
 *           type: string
 *           description: 🖼️ The avatar URL of the user
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: 🟢🔴 The status of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: ⏰ The timestamp when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: ⏳ The timestamp when the user was last updated
 *       example:
 *         id: 1
 *         firstName: "John"
 *         lastName: "Doe"
 *         fullName: "John Doe"
 *         yearOfBirth: 1990
 *         email: "john.doe@example.com"
 *         phone: "+998901234567"
 *         role: "User"
 *         avatar: "http://example.com/avatar.jpg"
 *         status: "Active"
 *         createdAt: "2023-10-01T12:34:56Z"
 *         updatedAt: "2023-10-01T12:34:56Z"
 *
 *     MyInfoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: ✅ Request status
 *         data:
 *           $ref: '#/components/schemas/User'
 *       example:
 *         success: true
 *         data:
 *           id: 1
 *           firstName: "John"
 *           lastName: "Doe"
 *           email: "john@example.com"
 *           phone: "+998901234567"
 *           yearOfBirth: 1990
 *           avatar: "avatar.jpg"
 *           role: "User"
 *           status: "Active"
 *           createdAt: "2023-01-01T00:00:00.000Z"
 *           updatedAt: "2023-01-10T00:00:00.000Z"
 */

module.exports = UsersRouter;
