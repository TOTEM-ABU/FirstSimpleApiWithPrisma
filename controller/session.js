const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
let winston = require("winston");
require("winston-mongodb");

let { json, combine, timestamp } = winston.format;

const logger = winston.createLogger({
  level: "silly",
  format: combine(timestamp(), json()),
  transports: [new winston.transports.File({ filename: "loggers.log" })],
});

let sessionLogger = logger.child({ module: "Session" });

const getAll = async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      sessionLogger.log("error", "Session not found!");
      return res.status(404).send("Session not found!");
    }

    sessionLogger.log("info", "Session retrieved!");
    res.send(session);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
    sessionLogger.log("error", "Server error!");
  }
};

const remove = async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      sessionLogger.log("error", "Session not found!");
      return res.status(404).send("Session not found!");
    }

    await prisma.session.delete({
      where: { id: session.id },
    });

    sessionLogger.log("info", "Session deleted!");
    res.send("Session deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
    sessionLogger.log("error", "Server error!");
  }
};

module.exports = { getAll, remove };
