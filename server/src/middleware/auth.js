const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'microlend-super-secure-jwt-secret-key-vit-2026';

// Authenticate Token Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Missing or malformed authentication token'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid, expired, or tampered token'
      });
    }

    req.user = decoded;
    next();
  });
}

// Require Role Middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: This operation requires elevated '${role}' privileges`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
