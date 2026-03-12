const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

function verifySuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401, 'UNAUTHORIZED');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.is_super_admin) {
      return error(res, 'Super admin access required', 403, 'FORBIDDEN');
    }
    req.superAdmin = decoded;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401, 'TOKEN_INVALID');
  }
}

module.exports = verifySuperAdmin;
