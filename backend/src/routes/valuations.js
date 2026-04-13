const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateValuation } = require('../services/valuation');
const prisma = new PrismaClient();

router.post('/generate', async (req, res) => {
  try {
    const valuation = await generateValuation(req.body.companyId);
    res.json(valuation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/company/:companyId', async (req, res) => {
  try {
    const valuations = await prisma.aiValuation.findMany({ where: { companyId: req.params.companyId }, orderBy: { generatedAt: 'desc' } });
    res.json(valuations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
