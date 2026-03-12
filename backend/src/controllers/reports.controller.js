const { Op } = require('sequelize');
const { success, error } = require('../utils/response');

async function financialReport(req, res) {
  try {
    const { TaxLedger, Expense } = req.models;
    const { from, to } = req.query;
    const dateWhere = {};
    if (from) dateWhere[Op.gte] = new Date(from);
    if (to) dateWhere[Op.lte] = new Date(to);

    const taxRows = await TaxLedger.findAll({
      where: from || to ? { collected_at: dateWhere } : {},
      attributes: [
        'type',
        [req.tenantDb.fn('SUM', req.tenantDb.col('amount')), 'total'],
      ],
      group: ['type'],
      raw: true,
    });

    const expenseRows = await Expense.findAll({
      where: {
        status: 'approved',
        ...(from || to ? { created_at: dateWhere } : {}),
      },
      attributes: [
        'category',
        [req.tenantDb.fn('SUM', req.tenantDb.col('amount')), 'total'],
      ],
      group: ['category'],
      raw: true,
    });

    const totalIncome = taxRows.reduce((s, r) => s + parseFloat(r.total || 0), 0);
    const totalExpense = expenseRows.reduce((s, r) => s + parseFloat(r.total || 0), 0);

    return success(res, { income: taxRows, expenses: expenseRows, summary: { total_income: totalIncome, total_expense: totalExpense, balance: totalIncome - totalExpense } });
  } catch (err) {
    return error(res, err.message);
  }
}

async function residentsReport(req, res) {
  try {
    const { Family, Member } = req.models;
    const totalFamilies = await Family.count();
    const totalMembers = await Member.count();
    const genderBreakdown = await Member.findAll({
      attributes: ['gender', [req.tenantDb.fn('COUNT', req.tenantDb.col('id')), 'count']],
      group: ['gender'],
      raw: true,
    });
    const wardBreakdown = await Family.findAll({
      attributes: ['ward_number', [req.tenantDb.fn('COUNT', req.tenantDb.col('id')), 'count']],
      group: ['ward_number'],
      raw: true,
    });
    const voters = await Member.count({ where: { is_voter: true } });
    return success(res, { total_families: totalFamilies, total_members: totalMembers, voters, gender_breakdown: genderBreakdown, ward_breakdown: wardBreakdown });
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { financialReport, residentsReport };
