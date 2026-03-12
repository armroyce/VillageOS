const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const verifyJWT = require('../middleware/verifyJWT');

router.post('/super-admin/login', ctrl.superAdminLogin);
router.post('/login', ctrl.villageLogin);
router.post('/logout', verifyJWT, ctrl.logout);
router.get('/me', verifyJWT, ctrl.me);

module.exports = router;
