// Auto-audit middleware factory — wraps a controller and writes to tenant_audit_logs
function withAudit(module, action) {
  return (controller) => async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (body?.success && req.models?.TenantAuditLog) {
        req.models.TenantAuditLog.create({
          user_id: req.user?.user_id,
          action,
          module,
          record_id: req.params?.id || body?.data?.id,
          new_value: body?.data,
          ip: req.ip,
        }).catch(() => {}); // fire-and-forget, never block response
      }
      return originalJson(body);
    };
    return controller(req, res, next);
  };
}

module.exports = { withAudit };
