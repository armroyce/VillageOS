const { success, error } = require('../utils/response');

async function listExpenses(req, res) {
  try {
    const { Expense } = req.models;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await Expense.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });
    return success(res, rows, 'OK', 200, { total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
}

async function createExpense(req, res) {
  try {
    const { Expense } = req.models;
    const { title, amount, category, expense_date } = req.body;
    if (!title || !amount) return error(res, 'title and amount required', 400, 'VALIDATION_ERROR');
    const bill_url = req.file ? `/uploads/${req.file.filename}` : null;
    const expense = await Expense.create({
      title, amount, category, bill_url,
      created_by: req.user.user_id,
      ...(expense_date && { createdAt: new Date(expense_date) }),
    });
    return success(res, expense, 'Expense created', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

async function approveExpense(req, res) {
  try {
    const { Expense, Approval, TenantAuditLog } = req.models;
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return error(res, 'Expense not found', 404, 'NOT_FOUND');
    if (expense.status !== 'pending') return error(res, 'Expense already processed', 400, 'ALREADY_PROCESSED');
    const old = expense.toJSON();
    await expense.update({ status: 'approved', approved_by: req.user.user_id });
    await Approval.create({ expense_id: expense.id, action: 'approved', actor_id: req.user.user_id, note: req.body.note });
    await TenantAuditLog.create({ user_id: req.user.user_id, action: 'EXPENSE_APPROVED', module: 'EXPENSE', record_id: expense.id, old_value: old, new_value: expense.toJSON(), ip: req.ip });
    return success(res, expense, 'Expense approved');
  } catch (err) {
    return error(res, err.message);
  }
}

async function rejectExpense(req, res) {
  try {
    const { Expense, Approval, TenantAuditLog } = req.models;
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return error(res, 'Expense not found', 404, 'NOT_FOUND');
    if (expense.status !== 'pending') return error(res, 'Expense already processed', 400, 'ALREADY_PROCESSED');
    const old = expense.toJSON();
    await expense.update({ status: 'rejected' });
    await Approval.create({ expense_id: expense.id, action: 'rejected', actor_id: req.user.user_id, note: req.body.note });
    await TenantAuditLog.create({ user_id: req.user.user_id, action: 'EXPENSE_REJECTED', module: 'EXPENSE', record_id: expense.id, old_value: old, new_value: expense.toJSON(), ip: req.ip });
    return success(res, expense, 'Expense rejected');
  } catch (err) {
    return error(res, err.message);
  }
}

async function getBillUrl(req, res) {
  try {
    const { Expense } = req.models;
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return error(res, 'Expense not found', 404, 'NOT_FOUND');
    return success(res, { bill_url: expense.bill_url });
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listExpenses, createExpense, approveExpense, rejectExpense, getBillUrl };
