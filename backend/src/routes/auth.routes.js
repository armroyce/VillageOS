const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const verifyJWT = require('../middleware/verifyJWT');

router.get('/villages', ctrl.listVillages);
router.post('/super-admin/login', ctrl.superAdminLogin);
router.post('/super-admin/change-password', verifyJWT, ctrl.superAdminChangePassword);
router.post('/login', ctrl.villageLogin);
router.post('/logout', verifyJWT, ctrl.logout);
router.get('/me', verifyJWT, ctrl.me);

module.exports = router;
