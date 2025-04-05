const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { userValidation, userValidationUpdate } = require("../validation/user");
const nodemailer = require("nodemailer");
const { totp } = require("otplib");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const sendSms = require("../middleware/eskiz");

dotenv.config();
const TOTP_KEY = process.env.SECRET_KEY;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

totp.options = { step: 1800, digits: 6 };

async function register(req, res) {
  try {
    const body = req.body;

    const findUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (findUser) {
      res.status(405).send({ message: "This account already exists ❗" });
      return;
    }

    const { error, value } = userValidation(body);
    if (error) {
      return res.status(422).send({ message: error.details[0].message });
    }

    value.password = await bcrypt.hash(body.password, 10);
    const registered = await prisma.user.create({ data: value });

    let otp = totp.generate(`${TOTP_KEY}${body.email}`);
    await transporter.sendMail({
      to: body.email,
      subject: "One-time password",
      html: `This is an OTP to activate your account: <h1>${otp}</h1> ❗`,
    });

    res.status(200).send({
      message:
        "Registered successfully ✅. We sent OTP to your email for activation ❗",
      data: registered,
    });
  } catch (error) {
    return res.status(500).send({ error_message: error.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const findUser = await prisma.user.findUnique({ where: { email } });
    if (!findUser) {
      res.status(405).send({ message: "Email is incorrect ❗" });
      return;
    }

    let checkOtp = totp.verify({ token: otp, secret: `${TOTP_KEY}${email}` });
    if (!checkOtp) {
      res.status(403).send({ message: "OTP is incorrect ❗" });
      return;
    }

    if (findUser.status === "Inactive") {
      await prisma.user.update({
        where: { email },
        data: { status: "Active" },
      });
    }

    res
      .status(200)
      .send({ message: "Your account has been activated successfully ✅" });
  } catch (error) {
    return res.status(500).send({ error_message: error.message });
  }
}

async function login(req, res) {
  let { password, email } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).send("User not found❗");
      return;
    }

    let match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).send("Invalid password ❗");
      return;
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      "access_secret",
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      "refresh_secret",
      { expiresIn: "7d" }
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      },
    });

    res.send({ accessToken, refreshToken });
  } catch (error) {
    return res.status(500).send("Internal Server Error ❗");
  }
}

async function accessTokenGenereate(payload) {
  try {
    let accessSecret = process.env.ACCESS_KEY || "access_secret";
    return jwt.sign(payload, accessSecret, { expiresIn: "15m" });
  } catch (error) {
    return console.log(error.message);
  }
}

async function refreshTokenGenereate(payload) {
  try {
    let accessSecret = process.env.REFRESH_KEY || "refresh_secret";
    return jwt.sign(payload, accessSecret, { expiresIn: "7d" });
  } catch (error) {
    return console.log(error.message);
  }
}

async function promoteToAdmin(req, res) {
  try {
    const role = "Admin";
    let { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.status(200).send({ message: "Updated successfully ✅" });
  } catch (error) {
    return res.status(400).send({ error_message: error.message });
  }
}

async function getNewAccessToken(req, res) {
  try {
    const refreshToken = req.body.refresh_token;
    let data = jwt.verify(
      refreshToken,
      process.env.REFRESH_KEY || "refresh_secret"
    );
    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (!user) {
      res.status(404).send({ message: "User not found ❗" });
      return;
    }
    let accessToken = await accessTokenGenereate({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    res.status(200).send({
      message: "New access token generated successfully ✅",
      access_token: accessToken,
    });
  } catch (error) {
    return res.status(400).send({ error_message: error.message });
  }
}

async function findAll(req, res) {
  try {
    if (req.user.role !== "Admin") {
      res.status(403).send({ message: "You are not allowed ❗" });
      authLogger.log("error", "You are not allowed ❗");
      return;
    }

    let {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      status,
      role,
      search,
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    let skip = (page - 1) * limit;

    let where = {};

    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          yearOfBirth: true,
          email: true,
          role: true,
          avatar: true,
          status: true,
          phone: true,
        },
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).send({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    return res.status(500).send({ error_message: error.message });
  }
}

async function findOne(req, res) {
  try {
    const { id } = req.params;
    let user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        yearOfBirth: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        phone: true,
      },
    });

    if (!user) {
      res.status(404).send({ message: "User not found ❗" });
      return;
    }
    res.status(200).send({ data: user });
  } catch (error) {
    return res.status(400).send({ error_message: error.message });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { error, value } = userValidationUpdate(req.body);
    if (error) {
      return res.status(422).send({ message: error.details[0].message });
    }

    if (value.password) {
      value.password = await bcrypt.hash(value.password, 10);
    }

    if (!["SuperAdmin", "Admin"].includes(req.user.role)) {
      res
        .status(403)
        .send({ message: "Only SuperAdmin and Admin can update User ❗️" });
      return;
    }

    let findUser = await prisma.user.findUnique({ where: { id } });
    if (!findUser) {
      res.status(403).send({ message: "User not found ❗" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: value,
    });

    res.status(200).send({
      message: "User updated successfully ✅",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).send({ error_message: error.message });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    let findUser = await prisma.user.findUnique({ where: { id } });
    if (!findUser) {
      res.status(404).send({ message: "User not found ❗️" });
      return;
    }

    if (findUser.role == "Admin") {
      res.status(403).send({ message: "Nobody can destroy admin ❗️" });
      return;
    }

    if (findUser.role !== "User") {
      res.status(403).send({ message: "Only User can be deleted ❗️" });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).send({ message: "User deleted successfully ✅" });
  } catch (error) {
    return res.status(400).send({ error_message: error.message });
  }
}

module.exports = {
  register,
  verifyOtp,
  login,
  findOne,
  findAll,
  update,
  remove,
  promoteToAdmin,
  getNewAccessToken,
  refreshTokenGenereate,
};
