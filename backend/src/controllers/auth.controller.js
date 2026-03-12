const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/control/SuperAdmin');
const Village = require('../models/control/Village');
const { decrypt } = require('../utils/crypto');
const { getTenantDb } = require('../config/tenantDb');
const { defineTenantModels } = require('../models/tenant');
const { success, error } = require('../utils/response');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// POST /api/v1/auth/super-admin/login
async function superAdminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400, 'VALIDATION_ERROR');

    const admin = await SuperAdmin.findOne({ where: { email } });
    if (!admin) return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const token = signToken({ user_id: admin.id, email: admin.email, is_super_admin: true, is_root: admin.is_root });
    const refreshToken = signRefreshToken({ user_id: admin.id, is_super_admin: true });

    return success(res, { token, refreshToken, user: { id: admin.id, name: admin.name, email: admin.email, is_super_admin: true, is_root: admin.is_root } }, 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/auth/login  (village user)
async function villageLogin(req, res) {
  try {
    const { email, password, village_id, subdomain } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400, 'VALIDATION_ERROR');

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const identifier = village_id || subdomain;
    if (!identifier) return error(res, 'village_id or subdomain required', 400, 'VALIDATION_ERROR');

    let village;
    if (UUID_RE.test(identifier)) {
      village = await Village.findByPk(identifier);
    } else {
      village = await Village.findOne({ where: { subdomain: identifier, is_active: true } });
    }

    if (!village) return error(res, 'Village not found', 404, 'NOT_FOUND');
    if (!village.is_active) return error(res, 'Village inactive', 403, 'FORBIDDEN');

    const connStr = decrypt(village.db_connection_string);
    const db = getTenantDb(connStr);
    const { User, RolePermission } = defineTenantModels(db);

    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user) return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return error(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');

    // Load permissions
    const rolePerms = user.role_id
      ? await RolePermission.findAll({ where: { role_id: user.role_id } })
      : [];
    const permissions = rolePerms.map((rp) => rp.permission_key);

    const token = signToken({
      user_id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      village_id: village.id,
      village_name: village.name,
      subdomain: village.subdomain,
      permissions,
    });
    const refreshToken = signRefreshToken({ user_id: user.id, village_id: village.id });

    return success(res, { token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id, permissions }, village: { id: village.id, name: village.name, subdomain: village.subdomain, logo_url: village.logo_url, theme_color: village.theme_color, language_default: village.language_default } }, 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/auth/super-admin/change-password
async function superAdminChangePassword(req, res) {
  try {
    if (!req.user?.is_super_admin) return error(res, 'Not authorized', 403, 'FORBIDDEN');
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return error(res, 'current_password and new_password required', 400, 'VALIDATION_ERROR');
    const admin = await SuperAdmin.findByPk(req.user.user_id);
    if (!admin) return error(res, 'Admin not found', 404, 'NOT_FOUND');
    const valid = await bcrypt.compare(current_password, admin.password_hash);
    if (!valid) return error(res, 'Current password is incorrect', 401, 'INVALID_CREDENTIALS');
    const hash = await bcrypt.hash(new_password, 12);
    await admin.update({ password_hash: hash });
    return success(res, {}, 'Password changed successfully');
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/auth/logout
async function logout(req, res) {
  // Stateless JWT — instruct client to discard token
  return success(res, {}, 'Logged out successfully');
}

// GET /api/v1/auth/me
async function me(req, res) {
  return success(res, { user: req.user });
}

module.exports = { superAdminLogin, superAdminChangePassword, villageLogin, logout, me };
