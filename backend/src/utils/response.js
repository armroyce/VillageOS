function success(res, data = {}, message = 'OK', statusCode = 200, pagination = null) {
  const payload = { success: true, data, message };
  if (pagination) payload.pagination = pagination;
  return res.status(statusCode).json(payload);
}

function error(res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', field = null) {
  const payload = { success: false, error: { code, message } };
  if (field) payload.error.field = field;
  return res.status(statusCode).json(payload);
}

module.exports = { success, error };
