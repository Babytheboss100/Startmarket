const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bronnoy = require('../services/bronnoy');
const { generateValuation } = require('../services/valuation');
const prisma = new PrismaClient();

router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.length < 2) return res.json([]);
    const results = await bronnoy.searchCompany(name);
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/lookup/:orgNr', async (req, res) => {
  try {
    const data = await bronnoy.fetchFullCompanyData(req.params.orgNr);
    res.json(data);
  } catch { res.status(404).json({ error: 'Fant ikke selskapet i Brønnøysundregisteret' }); }
});

router.get('/:orgNr', async (req, res) => {
  try {
    const orgNr = req.params.orgNr.replace(/\s/g, '');
    let company = await prisma.company.findUnique({
      where: { orgNr },
      include: { valuations: { orderBy: { generatedAt: 'desc' }, take: 1 }, listings: { where: { status: 'ACTIVE' } } }
    });

    // Create or refresh if not synced in last 24h
    const stale = !company?.lastSynced || (Date.now() - company.lastSynced.getTime() > 24 * 60 * 60 * 1000);
    if (!company || stale) {
      const full = await bronnoy.fetchFullCompanyData(orgNr);
      const companyData = {
        orgNr,
        name: full.name,
        industry: full.industry,
        employees: full.employees,
        foundedYear: full.foundedYear,
        orgForm: full.orgForm,
        vatRegistered: full.vatRegistered,
        isBankrupt: full.isBankrupt,
        address: full.address,
        latestRevenue: full.latestRevenue,
        latestProfit: full.latestProfit,
        latestEquity: full.latestEquity,
        latestDebt: full.latestDebt,
        accountingYear: full.accountingYear,
        boardMembers: full.boardMembers,
        bronnoyData: full.bronnoyData,
        lastSynced: new Date()
      };

      if (company) {
        company = await prisma.company.update({
          where: { orgNr },
          data: companyData,
          include: { valuations: { orderBy: { generatedAt: 'desc' }, take: 1 }, listings: { where: { status: 'ACTIVE' } } }
        });
      } else {
        company = await prisma.company.create({
          data: companyData,
          include: { valuations: { orderBy: { generatedAt: 'desc' }, take: 1 }, listings: { where: { status: 'ACTIVE' } } }
        });
      }
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

router.get('/:orgNr/shareholders', async (req, res) => {
  try {
    const shareholders = await prisma.shareholder.findMany({
      where: { orgNr: req.params.orgNr.replace(/\s/g, '') },
      orderBy: { shares: 'desc' }
    });
    res.json(shareholders.map(s => ({ ...s, shares: Number(s.shares), totalShares: Number(s.totalShares) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
