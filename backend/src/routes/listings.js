const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireKyc } = require('../middleware/auth');
const bronnoy = require('../services/bronnoy');
const prisma = new PrismaClient();

const include = {
  company: { include: { valuations: { orderBy: { generatedAt: 'desc' }, take: 1 } } },
  seller: { select: { id: true, fullName: true } },
  documents: { where: { isPublic: true } },
  _count: { select: { bids: true } }
};

router.get('/', async (req, res) => {
  try {
    const { industry, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'ACTIVE' };
    if (industry) where.company = { industry: { contains: industry, mode: 'insensitive' } };
    if (minPrice || maxPrice) {
      where.askingPricePerShare = {};
      if (minPrice) where.askingPricePerShare.gte = parseFloat(minPrice);
      if (maxPrice) where.askingPricePerShare.lte = parseFloat(maxPrice);
    }
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, skip, take: parseInt(limit), include, orderBy: { publishedAt: 'desc' } }),
      prisma.listing.count({ where })
    ]);
    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({ where: { sellerId: req.user.id }, include, orderBy: { createdAt: 'desc' } });
    res.json(listings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id }, include });
    if (!listing) return res.status(404).json({ error: 'Ikke funnet' });
    res.json(listing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, requireKyc, async (req, res) => {
  try {
    const { companyOrgNr, sharesForSale, totalShares, askingPricePerShare, priceType, description } = req.body;
    let company = await prisma.company.findUnique({ where: { orgNr: companyOrgNr } });
    if (!company) {
      const data = await bronnoy.fetchCompany(companyOrgNr);
      company = await prisma.company.create({
        data: { orgNr: companyOrgNr, name: data.navn, industry: data.naeringskode1?.beskrivelse, employees: data.antallAnsatte, bronnoyData: data, lastSynced: new Date() }
      });
    }
    const listing = await prisma.listing.create({
      data: { sellerId: req.user.id, companyId: company.id, sharesForSale: parseInt(sharesForSale), totalShares: parseInt(totalShares), askingPricePerShare: askingPricePerShare ? parseFloat(askingPricePerShare) : null, priceType: priceType || 'FIXED', description },
      include: { company: true }
    });
    res.status(201).json(listing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    const updated = await prisma.listing.update({ where: { id: req.params.id }, data: req.body, include });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/publish', requireAuth, requireKyc, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    const updated = await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'ACTIVE', publishedAt: new Date() }, include });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
