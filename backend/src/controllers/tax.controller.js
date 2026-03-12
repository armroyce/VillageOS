const { Op } = require('sequelize');
const { generateReceiptNumber } = require('../utils/receipt');
const { success, error } = require('../utils/response');

async function listTax(req, res) {
  try {
    const { TaxLedger, Family } = req.models;
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    const { count, rows } = await TaxLedger.findAndCountAll({
      where,
      include: [{ model: Family, as: 'family' }],  // fixed: no alias, use defaults or change below
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['collected_at', 'DESC']],
    });
    return success(res, rows, 'OK', 200, { total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
}

async function collectTax(req, res) {
  try {
    const { TaxLedger } = req.models;
    const { family_id, amount, type, collected_date } = req.body;
    if (!family_id || !amount || !type) return error(res, 'family_id, amount, type required', 400, 'VALIDATION_ERROR');
    const receipt_number = generateReceiptNumber();
    const record = await TaxLedger.create({
      family_id,
      amount,
      type,
      status: 'paid',
      collected_by: req.user.user_id,
      receipt_number,
      collected_at: collected_date ? new Date(collected_date) : new Date(),
    });
    return success(res, record, 'Tax collected', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

async function getReceipt(req, res) {
  try {
    const { TaxLedger, Family } = req.models;
    const record = await TaxLedger.findByPk(req.params.id);
    if (!record) return error(res, 'Record not found', 404, 'NOT_FOUND');
    // Return receipt data — PDF generation can be added later
    return success(res, record, 'Receipt data');
  } catch (err) {
    return error(res, err.message);
  }
}

async function getDues(req, res) {
  try {
    const { Family, TaxLedger } = req.models;
    // Families that have NEVER paid or have pending status
    const paidFamilyIds = await TaxLedger.findAll({
      where: { status: 'paid' },
      attributes: ['family_id'],
      raw: true,
    });
    const paidIds = paidFamilyIds.map((r) => r.family_id);
    const duesFamilies = await Family.findAll({
      where: paidIds.length ? { id: { [Op.notIn]: paidIds } } : {},
    });
    return success(res, duesFamilies);
  } catch (err) {
    return error(res, err.message);
  }
}

async function getTaxSummary(req, res) {
  try {
    const { TaxLedger } = req.models;
    const { sequelize } = req.tenantDb;
    const summary = await TaxLedger.findAll({
      attributes: [
        'type',
        'status',
        [req.tenantDb.fn('SUM', req.tenantDb.col('amount')), 'total'],
        [req.tenantDb.fn('COUNT', req.tenantDb.col('id')), 'count'],
      ],
      group: ['type', 'status'],
      raw: true,
    });
    return success(res, summary);
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listTax, collectTax, getReceipt, getDues, getTaxSummary };
