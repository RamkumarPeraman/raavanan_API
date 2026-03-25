const jwt = require("jsonwebtoken");
const { normalizeRole } = require("../utils/userHelpers");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token is required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "raavanan-dev-secret");
    req.user = {
      ...payload,
      role: normalizeRole(payload.role),
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const allowedRoles = roles.map(normalizeRole);

  if (allowedRoles.length > 0 && !allowedRoles.includes(normalizeRole(req.user.role))) {
    return res.status(403).json({ success: false, message: "You do not have permission for this action." });
  }

  return next();
};

module.exports = { authenticate, authorize };
