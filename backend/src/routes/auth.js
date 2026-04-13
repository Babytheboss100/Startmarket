const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const makeToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
const safeUser = (u) => ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, kycStatus: u.kycStatus, role: u.role, createdAt: u.createdAt });

router.post('/register', async (req, res) => {
  try {
    const { email, fullName, phone, password } = req.body;
    if (!email || !fullName || !password) return res.status(400).json({ error: 'Mangler påkrevde felt' });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'E-post er allerede i bruk' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, fullName, phone, passwordHash } });
    res.status(201).json({ token: makeToken(user.id), user: safeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Feil e-post eller passord' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Feil e-post eller passord' });
    res.json({ token: makeToken(user.id), user: safeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

module.exports = router;
