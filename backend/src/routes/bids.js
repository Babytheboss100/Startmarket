const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireKyc } = require('../middleware/auth');
const emailService = require('../services/email');
const prisma = new PrismaClient();

router.post('/', requireAuth, requireKyc, async (req, res) => {
  try {
    const { listingId, pricePerShare, sharesWanted, message } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { seller: true, company: true } });
    if (!listing || listing.status !== 'ACTIVE') return res.status(400).json({ error: 'Listing er ikke aktiv' });
    if (listing.sellerId === req.user.id) return res.status(400).json({ error: 'Du kan ikke by på din egen listing' });
    const bid = await prisma.bid.create({
      data: { listingId, buyerId: req.user.id, pricePerShare: parseFloat(pricePerShare), sharesWanted: parseInt(sharesWanted), message, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
    await emailService.sendBidNotification(listing.seller.email, listing, bid, req.user).catch(console.error);
    res.status(201).json(bid);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({ where: { buyerId: req.user.id }, include: { listing: { include: { company: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(bids);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/listing/:listingId', requireAuth, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
    if (!listing || listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    const bids = await prisma.bid.findMany({ where: { listingId: req.params.listingId }, include: { buyer: { select: { id: true, fullName: true, email: true, kycStatus: true } } }, orderBy: { pricePerShare: 'desc' } });
    res.json(bids);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/accept', requireAuth, requireKyc, async (req, res) => {
  try {
    const bid = await prisma.bid.findUnique({ where: { id: req.params.id }, include: { listing: true, buyer: true } });
    if (!bid) return res.status(404).json({ error: 'Bud ikke funnet' });
    if (bid.listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    const [updatedBid, dealRoom] = await prisma.$transaction([
      prisma.bid.update({ where: { id: bid.id }, data: { status: 'ACCEPTED' } }),
      prisma.dealRoom.create({ data: { listingId: bid.listingId, acceptedBidId: bid.id, members: { create: [{ userId: req.user.id, role: 'SELLER' }, { userId: bid.buyerId, role: 'BUYER' }] } }, include: { members: true } }),
      prisma.bid.updateMany({ where: { listingId: bid.listingId, id: { not: bid.id }, status: 'PENDING' }, data: { status: 'REJECTED' } })
    ]);
    await emailService.sendDealRoomCreated(bid.buyer.email, dealRoom).catch(console.error);
    res.json({ bid: updatedBid, dealRoom });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    const bid = await prisma.bid.findUnique({ where: { id: req.params.id }, include: { listing: true } });
    if (!bid || bid.listing.sellerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    const updated = await prisma.bid.update({ where: { id: bid.id }, data: { status: 'REJECTED' } });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const bid = await prisma.bid.findUnique({ where: { id: req.params.id } });
    if (!bid || bid.buyerId !== req.user.id) return res.status(403).json({ error: 'Ingen tilgang' });
    await prisma.bid.update({ where: { id: bid.id }, data: { status: 'WITHDRAWN' } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
