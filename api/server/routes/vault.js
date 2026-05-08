const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const { getVaultKeys, updateVaultKey, deleteVaultKey } = require('~/server/controllers/VaultController');

const router = express.Router();

router.get('/', requireJwtAuth, getVaultKeys);
router.post('/', requireJwtAuth, updateVaultKey);
router.delete('/:name', requireJwtAuth, deleteVaultKey);

module.exports = router;
