const { success, error } = require('../utils/response');

// GET /api/v1/roles
async function listRoles(req, res) {
  try {
    const { Role, RolePermission } = req.models;
    const roles = await Role.findAll({ include: [{ model: RolePermission, as: 'permissions' }] });
    return success(res, roles);
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/roles
async function createRole(req, res) {
  try {
    const { Role } = req.models;
    const { name, description } = req.body;
    if (!name) return error(res, 'name is required', 400, 'VALIDATION_ERROR');
    const role = await Role.create({ name, description });
    return success(res, role, 'Role created', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

// PUT /api/v1/roles/:id
async function updateRole(req, res) {
  try {
    const { Role } = req.models;
    const role = await Role.findByPk(req.params.id);
    if (!role) return error(res, 'Role not found', 404, 'NOT_FOUND');
    await role.update(req.body);
    return success(res, role, 'Role updated');
  } catch (err) {
    return error(res, err.message);
  }
}

// DELETE /api/v1/roles/:id
async function deleteRole(req, res) {
  try {
    const { Role } = req.models;
    const role = await Role.findByPk(req.params.id);
    if (!role) return error(res, 'Role not found', 404, 'NOT_FOUND');
    await role.destroy();
    return success(res, {}, 'Role deleted');
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /api/v1/roles/:id/permissions
async function assignPermissions(req, res) {
  try {
    const { RolePermission } = req.models;
    const { permission_keys } = req.body; // array of permission key strings
    if (!Array.isArray(permission_keys)) return error(res, 'permission_keys must be an array', 400, 'VALIDATION_ERROR');

    await RolePermission.destroy({ where: { role_id: req.params.id } });
    const records = permission_keys.map((key) => ({ role_id: req.params.id, permission_key: key }));
    await RolePermission.bulkCreate(records);
    return success(res, { role_id: req.params.id, permission_keys }, 'Permissions assigned');
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listRoles, createRole, updateRole, deleteRole, assignPermissions };
