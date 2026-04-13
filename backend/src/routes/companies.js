const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bronnoy = require('../services/bronnoy');
const { generateValuation } = require('../services/valuation');
const prisma = new PrismaClient();

router.get('/lookup/:orgNr', async (req, res) => {
  try {
    const data = await bronnoy.fetchCompany(req.params.orgNr);
    res.json(data);
  } catch { res.status(404).json({ error: 'Fant ikke selskapet i Brønnøysundregisteret' }); }
});

router.get('/:orgNr', async (req, res) => {
  try {
    let company = await prisma.company.findUnique({
      where: { orgNr: req.params.orgNr },
      include: { valuations: { orderBy: { generatedAt: 'desc' }, take: 1 }, listings: { where: { status: 'ACTIVE' } } }
    });
    if (!company) {
      const data = await bronnoy.fetchCompany(req.params.orgNr);
      company = await prisma.company.create({
        data: { orgNr: req.params.orgNr, name: data.navn, industry: data.naeringskode1?.beskrivelse, employees: data.antallAnsatte, bronnoyData: data, lastSynced: new Date() },
        include: { valuations: true, listings: true }
      });
    }
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:orgNr/valuate', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { orgNr: req.params.orgNr } });
    if (!company) return res.status(404).json({ error: 'Selskap ikke funnet' });
    const valuation = await generateValuation(company.id);
    res.json(valuation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
