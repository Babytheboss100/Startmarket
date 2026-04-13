const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Ikke autentisert' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'Bruker ikke funnet' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Ugyldig token' });
  }
};

const requireKyc = (req, res, next) => {
  if (req.user.kycStatus !== 'VERIFIED')
    return res.status(403).json({ error: 'KYC-verifisering kreves', kycRequired: true });
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN')
    return res.status(403).json({ error: 'Kun for administratorer' });
  next();
};

module.exports = { requireAuth, requireKyc, requireAdmin };
