const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const verifyJWT = require('../middleware/verifyJWT');
const resolveTenant = require('../middleware/resolveTenant');
const connectTenantDB = require('../middleware/connectTenantDB');
const checkPermission = require('../middleware/checkPermission');
const checkPlan = require('../middleware/checkPlan');

const roleCtrl = require('../controllers/roles.controller');
const userCtrl = require('../controllers/users.controller');
const familyCtrl = require('../controllers/families.controller');
const taxCtrl = require('../controllers/tax.controller');
const expenseCtrl = require('../controllers/expenses.controller');
const auditCtrl = require('../controllers/audit.controller');
const reportCtrl = require('../controllers/reports.controller');
const configCtrl = require('../controllers/config.controller');

// File upload config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user?.village_id || 'unknown'}-${Date.now()}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// All tenant routes require JWT + tenant context
router.use(verifyJWT, resolveTenant, connectTenantDB);

// Config (no extra permission needed)
router.get('/config', configCtrl.getTenantConfig);

// Roles
router.get('/roles', checkPermission('ROLE_VIEW'), roleCtrl.listRoles);
router.post('/roles', checkPermission('ROLE_MANAGE'), checkPlan('custom_roles'), roleCtrl.createRole);
router.put('/roles/:id', checkPermission('ROLE_MANAGE'), checkPlan('custom_roles'), roleCtrl.updateRole);
router.delete('/roles/:id', checkPermission('ROLE_MANAGE'), checkPlan('custom_roles'), roleCtrl.deleteRole);
router.post('/roles/:id/permissions', checkPermission('ROLE_MANAGE'), checkPlan('custom_roles'), roleCtrl.assignPermissions);

// Users
router.get('/users', checkPermission('USER_VIEW'), userCtrl.listUsers);
router.post('/users', checkPermission('USER_CREATE'), userCtrl.createUser);     // max-user check inside controller
router.put('/users/:id', checkPermission('USER_EDIT'), userCtrl.updateUser);
router.delete('/users/:id', checkPermission('USER_EDIT'), userCtrl.deleteUser);
router.post('/users/:id/role', checkPermission('ROLE_MANAGE'), userCtrl.assignRole);

// Families
router.get('/families', checkPermission('FAMILY_VIEW'), familyCtrl.listFamilies);
router.post('/families', checkPermission('FAMILY_CREATE'), familyCtrl.createFamily);
router.get('/families/:id', checkPermission('FAMILY_VIEW'), familyCtrl.getFamily);
router.put('/families/:id', checkPermission('FAMILY_EDIT'), familyCtrl.updateFamily);
router.delete('/families/:id', checkPermission('FAMILY_DELETE'), checkPlan('family_delete'), familyCtrl.deleteFamily);
router.get('/families/:id/members', checkPermission('FAMILY_VIEW'), familyCtrl.listMembers);
router.post('/families/:id/members', checkPermission('FAMILY_CREATE'), familyCtrl.addMember);
router.put('/members/:id', checkPermission('FAMILY_EDIT'), familyCtrl.updateMember);
router.delete('/members/:id', checkPermission('FAMILY_DELETE'), checkPlan('family_delete'), familyCtrl.deleteMember);

// Tax
router.get('/tax', checkPermission('TAX_VIEW'), taxCtrl.listTax);
router.post('/tax', checkPermission('TAX_CREATE'), taxCtrl.collectTax);
router.post('/tax/assign', checkPermission('TAX_CREATE'), taxCtrl.assignTax);
router.get('/tax/assignments', checkPermission('TAX_VIEW'), taxCtrl.getAssignments);
router.get('/tax/assignments/:description/status', checkPermission('TAX_VIEW'), taxCtrl.getAssignmentStatus);
router.get('/tax/family/:familyId/dues', checkPermission('TAX_VIEW'), taxCtrl.getFamilyDues);
router.get('/tax/receipt/:id', checkPermission('TAX_VIEW'), taxCtrl.getReceipt);
router.get('/tax/dues', checkPermission('TAX_VIEW'), taxCtrl.getDues);
router.get('/tax/summary', checkPermission('TAX_VIEW'), taxCtrl.getTaxSummary);

// Expenses — Standard & Premium only
router.get('/expenses', checkPermission('EXPENSE_VIEW'), checkPlan('expenses'), expenseCtrl.listExpenses);
router.post('/expenses', checkPermission('EXPENSE_CREATE'), checkPlan('expenses'), checkPlan('file_uploads'), upload.single('bill'), expenseCtrl.createExpense);
router.put('/expenses/:id/approve', checkPermission('EXPENSE_APPROVE'), checkPlan('expenses'), expenseCtrl.approveExpense);
router.put('/expenses/:id/reject', checkPermission('EXPENSE_APPROVE'), checkPlan('expenses'), expenseCtrl.rejectExpense);
router.get('/expenses/:id/bill', checkPermission('EXPENSE_VIEW'), checkPlan('expenses'), expenseCtrl.getBillUrl);

// Audit
router.get('/audit', checkPermission('AUDIT_VIEW'), auditCtrl.listAudit);

// Reports
router.get('/reports/financial', checkPermission('AUDIT_VIEW'), reportCtrl.financialReport);
router.get('/reports/residents', checkPermission('FAMILY_VIEW'), reportCtrl.residentsReport);

module.exports = router;
