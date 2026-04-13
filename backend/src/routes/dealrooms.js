const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { calculateFees } = require('../utils/fees');
const prisma = new PrismaClient();

const drInclude = {
  listing: { include: { company: true } },
  acceptedBid: { include: { buyer: { select: { id: true, fullName: true, email: true } } } },
  members: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  messages: { include: { sender: { select: { id: true, fullName: true } } }, orderBy: { sentAt: 'asc' } },
  documents: true,
  transaction: true
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const rooms = await prisma.dealRoom.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: { listing: { include: { company: true } }, members: true, _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(rooms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const room = await prisma.dealRoom.findUnique({ where: { id: req.params.id }, include: drInclude });
    if (!room) return res.status(404).json({ error: 'Ikke funnet' });
    if (!room.members.some(m => m.userId === req.user.id)) return res.status(403).json({ error: 'Ingen tilgang' });
    res.json(room);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const room = await prisma.dealRoom.findUnique({ where: { id: req.params.id }, include: { members: true } });
    if (!room || !room.members.some(m => m.userId === req.user.id)) return res.status(403).json({ error: 'Ingen tilgang' });
    const msg = await prisma.dealRoomMessage.create({
      data: { dealRoomId: req.params.id, senderId: req.user.id, content: req.body.content },
      include: { sender: { select: { id: true, fullName: true } } }
    });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/nda', requireAuth, async (req, res) => {
  try {
    const room = await prisma.dealRoom.findUnique({ where: { id: req.params.id }, include: { members: true } });
    if (!room) return res.status(404).json({ error: 'Ikke funnet' });
    const member = room.members.find(m => m.userId === req.user.id);
    if (!member) return res.status(403).json({ error: 'Ingen tilgang' });
    const update = member.role === 'SELLER' ? { ndaSignedSeller: true } : { ndaSignedBuyer: true };
    let updated = await prisma.dealRoom.update({ where: { id: req.params.id }, data: update });
    if (updated.ndaSignedSeller && updated.ndaSignedBuyer) {
      updated = await prisma.dealRoom.update({ where: { id: req.params.id }, data: { stage: 'DD_ACTIVE' } });
    }
    res.json({ ok: true, stage: updated.stage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/stage', requireAuth, async (req, res) => {
  try {
    const { stage } = req.body;
    const room = await prisma.dealRoom.findUnique({ where: { id: req.params.id }, include: { members: true } });
    if (!room) return res.status(404).json({ error: 'Ikke funnet' });
    const isSeller = room.members.find(m => m.userId === req.user.id && m.role === 'SELLER');
    if (!isSeller && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Kun selger kan endre stage' });
    const updated = await prisma.dealRoom.update({ where: { id: req.params.id }, data: { stage } });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/fees', requireAuth, async (req, res) => {
  try {
    const room = await prisma.dealRoom.findUnique({ where: { id: req.params.id }, include: { acceptedBid: true, members: true } });
    if (!room || !room.members.some(m => m.userId === req.user.id)) return res.status(403).json({ error: 'Ingen tilgang' });
    const totalValue = Number(room.acceptedBid.pricePerShare) * room.acceptedBid.sharesWanted;
    res.json({ totalValue, ...calculateFees(totalValue) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
