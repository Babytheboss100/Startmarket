const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [users, listings, bids, dealRooms, transactions] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.bid.count(),
      prisma.dealRoom.count(),
      prisma.transaction.aggregate({ _sum: { totalValue: true }, where: { status: 'COMPLETED' } })
    ]);
    res.json({ users, listings, bids, dealRooms, totalVolume: transactions._sum.totalValue || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, email: true, fullName: true, kycStatus: true, role: true, createdAt: true } });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/kyc', async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { kycStatus: req.body.kycStatus } });
    res.json({ id: user.id, kycStatus: user.kycStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role } });
    res.json({ id: user.id, role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/listings', async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { company: true, seller: { select: { id: true, fullName: true, email: true } }, _count: { select: { bids: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(listings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/listings/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: req.body });
    res.json(listing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
