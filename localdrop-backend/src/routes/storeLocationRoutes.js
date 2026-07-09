// src/routes/storeLocationRoutes.js
'use strict';

const { Router } = require('express');
const { listStoreLocations, upsertStoreLocation, deleteStoreLocation } = require('../controllers/storeLocationController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', verifyToken, requireRole('business'), listStoreLocations);
router.post('/', verifyToken, requireRole('business'), upsertStoreLocation);
router.put('/:id', verifyToken, requireRole('business'), (req, res, next) => {
  req.body.id = req.params.id;
  return upsertStoreLocation(req, res, next);
});
router.delete('/:id', verifyToken, requireRole('business'), deleteStoreLocation);

module.exports = router;
