const { error } = require('../utils/response');

function checkPermission(permissionKey) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    if (!permissions.includes(permissionKey)) {
      return error(res, `Permission denied: ${permissionKey}`, 403, 'PERMISSION_DENIED');
    }
    next();
  };
}

module.exports = checkPermission;
