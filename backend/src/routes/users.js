const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/me/dashboard', requireAuth, async (req, res) => {
  try {
    const [myListings, myBids, myDealRooms] = await Promise.all([
      prisma.listing.findMany({ where: { sellerId: req.user.id }, include: { company: true, _count: { select: { bids: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.bid.findMany({ where: { buyerId: req.user.id }, include: { listing: { include: { company: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.dealRoom.findMany({ where: { members: { some: { userId: req.user.id } } }, include: { listing: { include: { company: true } }, members: true }, orderBy: { updatedAt: 'desc' }, take: 10 })
    ]);
    res.json({ myListings, myBids, myDealRooms });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { fullName, phone } });
    res.json({ id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, kycStatus: user.kycStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/me/kyc', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { kycStatus: 'PENDING' } });
    res.json({ message: 'KYC-søknad mottatt – behandles innen 1 virkedag', kycStatus: user.kycStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
