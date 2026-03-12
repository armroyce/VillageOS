const { Op } = require('sequelize');
const { success, error } = require('../utils/response');

async function listFamilies(req, res) {
  try {
    const { Family, Member, TaxLedger } = req.models;
    const { page = 1, limit = 20, search, ward } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where[Op.or] = [
      { family_head_name: { [Op.iLike]: `%${search}%` } },
      { family_name: { [Op.iLike]: `%${search}%` } },
    ];
    if (ward) where.ward_number = ward;
    const { count, rows } = await Family.findAndCountAll({
      where,
      include: [
        { model: Member, as: 'members', attributes: ['id'] },
        { model: TaxLedger, as: 'taxes', where: { status: 'pending' }, required: false, attributes: ['id', 'amount', 'description', 'type'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });
    // Attach dues summary to each family
    const data = rows.map((f) => {
      const json = f.toJSON();
      const pendingDues = json.taxes || [];
      json.total_due = pendingDues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      json.dues_count = pendingDues.length;
      return json;
    });
    return success(res, data, 'OK', 200, { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) });
  } catch (err) {
    return error(res, err.message);
  }
}

async function createFamily(req, res) {
  try {
    const { Family } = req.models;
    const { family_name, family_head_name, address, ward_number, phone_number } = req.body;
    if (!family_head_name) return error(res, 'family_head_name required', 400, 'VALIDATION_ERROR');
    const family = await Family.create({ family_name, family_head_name, address, ward_number, phone_number, created_by: req.user.user_id });
    return success(res, family, 'Family created', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

async function getFamily(req, res) {
  try {
    const { Family, Member, TaxLedger } = req.models;
    const family = await Family.findByPk(req.params.id, {
      include: [
        { model: Member, as: 'members' },
        { model: TaxLedger, as: 'taxes', order: [['collected_at', 'DESC']] },
      ],
    });
    if (!family) return error(res, 'Family not found', 404, 'NOT_FOUND');
    const json = family.toJSON();
    json.pending_dues = (json.taxes || []).filter((t) => t.status === 'pending');
    json.total_due = json.pending_dues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return success(res, json);
  } catch (err) {
    return error(res, err.message);
  }
}

async function updateFamily(req, res) {
  try {
    const { Family } = req.models;
    const family = await Family.findByPk(req.params.id);
    if (!family) return error(res, 'Family not found', 404, 'NOT_FOUND');
    await family.update(req.body);
    return success(res, family, 'Family updated');
  } catch (err) {
    return error(res, err.message);
  }
}

async function deleteFamily(req, res) {
  try {
    const { Family } = req.models;
    const family = await Family.findByPk(req.params.id);
    if (!family) return error(res, 'Family not found', 404, 'NOT_FOUND');
    await family.destroy();
    return success(res, {}, 'Family deleted');
  } catch (err) {
    return error(res, err.message);
  }
}

async function listMembers(req, res) {
  try {
    const { Member } = req.models;
    const members = await Member.findAll({ where: { family_id: req.params.id } });
    return success(res, members);
  } catch (err) {
    return error(res, err.message);
  }
}

async function addMember(req, res) {
  try {
    const { Member } = req.models;
    const { name, age, gender, relation, aadhaar_last4, is_voter } = req.body;
    if (!name) return error(res, 'name required', 400, 'VALIDATION_ERROR');
    const member = await Member.create({ family_id: req.params.id, name, age, gender, relation, aadhaar_last4, is_voter });
    return success(res, member, 'Member added', 201);
  } catch (err) {
    return error(res, err.message);
  }
}

async function updateMember(req, res) {
  try {
    const { Member } = req.models;
    const member = await Member.findByPk(req.params.id);
    if (!member) return error(res, 'Member not found', 404, 'NOT_FOUND');
    await member.update(req.body);
    return success(res, member, 'Member updated');
  } catch (err) {
    return error(res, err.message);
  }
}

async function deleteMember(req, res) {
  try {
    const { Member } = req.models;
    const member = await Member.findByPk(req.params.id);
    if (!member) return error(res, 'Member not found', 404, 'NOT_FOUND');
    await member.destroy();
    return success(res, {}, 'Member deleted');
  } catch (err) {
    return error(res, err.message);
  }
}

module.exports = { listFamilies, createFamily, getFamily, updateFamily, deleteFamily, listMembers, addMember, updateMember, deleteMember };
