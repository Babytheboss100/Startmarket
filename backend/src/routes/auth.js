const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { logLoginEvent } = require('../utils/loginEvent');
const prisma = new PrismaClient();

const makeToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
const safeUser = (u) => ({
  id: u.id, email: u.email, fullName: u.fullName, phone: u.phone,
  kycStatus: u.kycStatus, role: u.role, createdAt: u.createdAt,
  avatarUrl: u.avatarUrl, authProvider: u.authProvider,
  googleLinked: !!u.googleId,
});

function extractContext(req) {
  const tenantId = req.body?.tenant || req.query?.tenant || null;
  const utm = req.body?.utm || {};
  return { tenantId, utm };
}

router.post('/register', async (req, res) => {
  const { tenantId, utm } = extractContext(req);
  try {
    const { email, fullName, phone, password } = req.body;
    if (!email || !fullName || !password) {
      await logLoginEvent({
        req, email, provider: 'email', eventType: 'login_failure',
        success: false, failureReason: 'missing_fields', tenantId, utm,
      });
      return res.status(400).json({ error: 'Mangler påkrevde felt' });
    }
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      await logLoginEvent({
        req, email, provider: 'email', eventType: 'login_failure',
        success: false, failureReason: 'email_in_use', tenantId, utm,
      });
      return res.status(400).json({ error: 'E-post er allerede i bruk' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), fullName, phone, passwordHash, authProvider: 'email' },
    });
    await logLoginEvent({
      req, userId: user.id, email: user.email,
      provider: 'email', eventType: 'register', success: true, tenantId, utm,
    });
    res.status(201).json({ token: makeToken(user.id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { tenantId, utm } = extractContext(req);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      await logLoginEvent({
        req, email, provider: 'email', eventType: 'login_failure',
        success: false, failureReason: 'missing_credentials', tenantId, utm,
      });
      return res.status(400).json({ error: 'E-post og passord er påkrevd' });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      await logLoginEvent({
        req, email, provider: 'email', eventType: 'login_failure',
        success: false, failureReason: 'user_not_found', tenantId, utm,
      });
      return res.status(401).json({ error: 'Feil e-post eller passord' });
    }
    if (!user.passwordHash) {
      await logLoginEvent({
        req, userId: user.id, email: user.email,
        provider: 'email', eventType: 'login_failure',
        success: false, failureReason: 'oauth_only_account', tenantId, utm,
      });
      return res.status(401).json({ error: 'Denne kontoen bruker Google-innlogging' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await logLoginEvent({
        req, userId: user.id, email: user.email,
        provider: 'email', eventType: 'login_failure',
        success: false, failureReason: 'wrong_password', tenantId, utm,
      });
      return res.status(401).json({ error: 'Feil e-post eller passord' });
    }
    await logLoginEvent({
      req, userId: user.id, email: user.email,
      provider: 'email', eventType: 'login_success', success: true, tenantId, utm,
    });
    res.json({ token: makeToken(user.id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  const { tenantId } = extractContext(req);
  await logLoginEvent({
    req, userId: req.user.id, email: req.user.email,
    provider: req.user.authProvider || 'email',
    eventType: 'logout', success: true, tenantId,
  });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

module.exports = router;
