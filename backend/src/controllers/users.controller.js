const bcrypt = require('bcrypt');
const { success, error } = require('../utils/response');

async function listUsers(req, res) {
  try {
    const { User, Role } = req.models;
    const users = await User.findAll({ include: [{ model: Role, as: 'role' }], attributes: { exclude: ['password_hash'] } });
    return success(res, users);
  } catch (err) {
    return error(res, err.message);
  }
}

async function createUser(req, res) {
  try {
    const { User } = req.models;
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password) return error(res, 'name, email, password required', 400, 'VALIDATION_ERROR');
    const existing = await User.findOne({ where: { email } });
    if (existing) return error(res, 'Email already exists', 409, 'DUPLICATE');
    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password_hash, role_id });
    return success(res, { id: user.id, name: user.name, email: user.email, role_id: user.role_id }, 'User created', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

async function updateUser(req, res) {
  try {
    const { User } = req.models;
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404, 'NOT_FOUND');
    const { name, is_active } = req.body;
    await user.update({ name, is_active });
    return success(res, user, 'User updated');
  } catch (err) {
    return error(res, err.message);
  }
}

async function deleteUser(req, res) {
  try {
    const { User } = req.models;
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404, 'NOT_FOUND');
    await user.update({ is_active: false });
    return success(res, {}, 'User deactivated');
  } catch (err) {
    return error(res, err.message);
  }
}

async function assignRole(req, res) {
  try {
    const { User } = req.models;
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404, 'NOT_FOUND');
    const { role_id } = req.body;
    await user.update({ role_id });
    return success(res, { user_id: user.id, role_id }, 'Role assigned');
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser, assignRole };
