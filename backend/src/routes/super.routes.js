const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/super.controller');
const verifySuperAdmin = require('../middleware/verifySuperAdmin');

router.use(verifySuperAdmin);
router.get('/villages', ctrl.listVillages);
router.post('/villages', ctrl.createVillage);
router.put('/villages/:id', ctrl.updateVillage);
router.get('/permissions', ctrl.listPermissions);
router.post('/permissions', ctrl.createPermission);

module.exports = router;
