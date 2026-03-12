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
      include: [{ model: Family, as: 'family' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['collected_at', 'DESC']],
    });
    return success(res, rows, 'OK', 200, { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) });
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /tax/assign — bulk create pending records for selected families
async function assignTax(req, res) {
  try {
    const { TaxLedger, Family } = req.models;
    const { type, amount, description, due_date, select_all, ward_numbers, family_ids } = req.body;

    if (!type || !amount || !description) {
      return error(res, 'type, amount and description are required', 400, 'VALIDATION_ERROR');
    }

    // Resolve target families
    let families = [];
    if (select_all) {
      families = await Family.findAll({ attributes: ['id'] });
    } else if (ward_numbers?.length) {
      families = await Family.findAll({ where: { ward_number: { [Op.in]: ward_numbers } }, attributes: ['id'] });
    } else if (family_ids?.length) {
      families = family_ids.map((id) => ({ id }));
    } else {
      return error(res, 'Specify select_all, ward_numbers, or family_ids', 400, 'VALIDATION_ERROR');
    }

    if (!families.length) return error(res, 'No families found for the given selection', 404, 'NOT_FOUND');

    // Create pending records (skip families that already have a pending record for same description)
    const existing = await TaxLedger.findAll({
      where: { description, status: 'pending' },
      attributes: ['family_id'],
    });
    const existingIds = new Set(existing.map((r) => r.family_id));

    const records = families
      .filter((f) => !existingIds.has(f.id))
      .map((f) => ({
        family_id: f.id,
        amount,
        type,
        status: 'pending',
        description,
        collected_at: due_date ? new Date(due_date) : new Date(),
      }));

    if (!records.length) return error(res, 'All selected families already have a pending record for this assignment', 409, 'DUPLICATE');

    await TaxLedger.bulkCreate(records);
    return success(res, { assigned: records.length, skipped: families.length - records.length }, `Tax assigned to ${records.length} families`, 201);
  } catch (err) {
    return error(res, err.message);
  }
}

// GET /tax/assignments — list all unique assignments (grouped by description)
async function getAssignments(req, res) {
  try {
    const { TaxLedger } = req.models;
    const rows = await TaxLedger.findAll({
      where: { description: { [Op.ne]: null } },
      attributes: [
        'description', 'type', 'amount',
        [TaxLedger.sequelize.fn('COUNT', TaxLedger.sequelize.col('id')), 'total'],
        [TaxLedger.sequelize.fn('SUM', TaxLedger.sequelize.literal("CASE WHEN status='paid' THEN 1 ELSE 0 END")), 'paid_count'],
        [TaxLedger.sequelize.fn('SUM', TaxLedger.sequelize.literal("CASE WHEN status='pending' THEN 1 ELSE 0 END")), 'pending_count'],
        [TaxLedger.sequelize.fn('MIN', TaxLedger.sequelize.col('collected_at')), 'due_date'],
      ],
      group: ['description', 'type', 'amount'],
      order: [[TaxLedger.sequelize.fn('MIN', TaxLedger.sequelize.col('collected_at')), 'DESC']],
      raw: true,
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
}

// GET /tax/assignments/:description/status — paid/unpaid families for an assignment
async function getAssignmentStatus(req, res) {
  try {
    const { TaxLedger, Family } = req.models;
    const description = decodeURIComponent(req.params.description);
    const rows = await TaxLedger.findAll({
      where: { description },
      include: [{ model: Family, as: 'family', attributes: ['id', 'family_head_name', 'ward_number', 'phone_number'] }],
      order: [['status', 'ASC'], [Family, 'ward_number', 'ASC']],
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
}

// POST /tax — collect tax (mark existing pending as paid, or create new paid record)
async function collectTax(req, res) {
  try {
    const { TaxLedger } = req.models;
    const { family_id, amount, type, collected_date, tax_ledger_id } = req.body;

    // If collecting against an existing pending record
    if (tax_ledger_id) {
      const record = await TaxLedger.findByPk(tax_ledger_id);
      if (!record) return error(res, 'Tax record not found', 404, 'NOT_FOUND');
      if (record.status === 'paid') return error(res, 'Already paid', 400, 'ALREADY_PAID');
      const receipt_number = generateReceiptNumber();
      await record.update({
        status: 'paid',
        collected_by: req.user.user_id,
        receipt_number,
        collected_at: collected_date ? new Date(collected_date) : new Date(),
      });
      return success(res, record, 'Tax collected', 200);
    }

    // Otherwise create a new paid record
    if (!family_id || !amount || !type) return error(res, 'family_id, amount, type required', 400, 'VALIDATION_ERROR');
    const receipt_number = generateReceiptNumber();
    const record = await TaxLedger.create({
      family_id, amount, type,
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
    const record = await TaxLedger.findByPk(req.params.id, {
      include: [{ model: Family, as: 'family', attributes: ['family_head_name', 'ward_number'] }],
    });
    if (!record) return error(res, 'Record not found', 404, 'NOT_FOUND');
    return success(res, record, 'Receipt data');
  } catch (err) {
    return error(res, err.message);
  }
}

async function getDues(req, res) {
  try {
    const { Family, TaxLedger } = req.models;
    const paidFamilyIds = await TaxLedger.findAll({
      where: { status: 'paid' }, attributes: ['family_id'], raw: true,
    });
    const paidIds = [...new Set(paidFamilyIds.map((r) => r.family_id))];
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
    const summary = await TaxLedger.findAll({
      attributes: [
        'type', 'status',
        [TaxLedger.sequelize.fn('SUM', TaxLedger.sequelize.col('amount')), 'total'],
        [TaxLedger.sequelize.fn('COUNT', TaxLedger.sequelize.col('id')), 'count'],
      ],
      group: ['type', 'status'],
      raw: true,
    });
    return success(res, summary);
  } catch (err) {
    return error(res, err.message);
  }
}

// GET /tax/family/:familyId/dues — pending dues for a specific family
async function getFamilyDues(req, res) {
  try {
    const { TaxLedger } = req.models;
    const dues = await TaxLedger.findAll({
      where: { family_id: req.params.familyId, status: 'pending' },
      order: [['collected_at', 'ASC']],
    });
    return success(res, dues);
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listTax, assignTax, getAssignments, getAssignmentStatus, collectTax, getReceipt, getDues, getTaxSummary, getFamilyDues };
