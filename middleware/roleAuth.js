const jwt = require("jsonwebtoken");

function roleMiddleware(roles) {
  return (req, res, next) => {
    let token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Token not provided or invalid format!");
    }

    try {
      let data = jwt.verify(token, "access_secret");
      if (roles.includes(data.role)) {
        req.userId = data.id;
        req.userRole = data.role;
        next();
      } else {
        return res.status(403).send({ message: "Not allowed!" });
      }
    } catch (error) {
      res.status(401).json({ message: "Invalid token!", error: error.message });
    }
  };
}

module.exports = roleMiddleware;
