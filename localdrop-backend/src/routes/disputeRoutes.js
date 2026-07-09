// src/routes/disputeRoutes.js
'use strict';

const { Router } = require('express');
const { createDispute, getBusinessDisputes, getDisputeById, resolveDispute } = require('../controllers/disputeController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.post('/',              verifyToken, requireRole('business'),        createDispute);
router.get('/business',       verifyToken, requireRole('business'),        getBusinessDisputes);
router.get('/admin',          verifyToken, requireRole('admin'),           (req, res, next) => {
  // Proxy to admin controller's getAllDisputes
  require('../controllers/adminController').getAllDisputes(req, res, next);
});
router.get('/:id',            verifyToken,                                 getDisputeById);
router.patch('/:id/resolve',  verifyToken, requireRole('admin'),           resolveDispute);

module.exports = router;
