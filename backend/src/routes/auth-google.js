// routes/auth-google.js
// Google OAuth 2.0 — kick-off + callback
// Stateless: state-parameter er JWT (10 min TTL), ingen server-side session nødvendig.

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { PrismaClient } = require('@prisma/client');
const { logLoginEvent } = require('../utils/loginEvent');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:3001/auth/google/callback';

// Tenant → frontend-URL-oppslag. Samme mønster som helptruth for symmetri.
// Prioritet: FRONTEND_URL_<TENANT> > FRONTEND_URL > tenant-default.
const TENANT_FRONTEND_DEFAULTS = {
  breedz: 'https://marketplace.breedz.eu',
};

function frontendUrlFor(tenant) {
  const key = (tenant || 'breedz').toLowerCase();
  const envSpecific = process.env[`FRONTEND_URL_${key.toUpperCase()}`];
  if (envSpecific) return envSpecific;
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  return TENANT_FRONTEND_DEFAULTS[key] || TENANT_FRONTEND_DEFAULTS.breedz;
}

function oauth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET er ikke konfigurert');
  }
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
}

function redirectToCallback(res, tenant, params) {
  const qs = new URLSearchParams(params);
  res.redirect(`${frontendUrlFor(tenant)}/auth/callback?${qs.toString()}`);
}

const makeToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

// ── GET /auth/google ─────────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const {
    tenant = 'breedz',
    mode = 'login',
    redirect = '',
    utm_source = '',
    utm_medium = '',
    utm_campaign = '',
  } = req.query;

  let state;
  try {
    state = jwt.sign(
      {
        tenant,
        mode,
        redirect,
        utm: { source: utm_source, medium: utm_medium, campaign: utm_campaign },
        nonce: crypto.randomBytes(16).toString('hex'),
      },
      JWT_SECRET,
      { expiresIn: '10m' }
    );
  } catch (err) {
    return res.status(500).json({ error: 'Kunne ikke starte Google-innlogging' });
  }

  let url;
  try {
    url = oauth().generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    });
  } catch (err) {
    console.error('Google auth URL error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  res.redirect(url);
});

// ── GET /auth/google/callback ────────────────────────────────────────────
router.get('/google/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    await logLoginEvent({
      req,
      provider: 'google',
      eventType: 'login_failure',
      success: false,
      failureReason: `oauth_error:${oauthError}`,
    });
    return redirectToCallback(res, null, { google_error: 'oauth_denied' });
  }

  if (!code || !state) {
    return redirectToCallback(res, null, { google_error: 'missing_params' });
  }

  let statePayload;
  try {
    statePayload = jwt.verify(state, JWT_SECRET);
  } catch {
    await logLoginEvent({
      req,
      provider: 'google',
      eventType: 'login_failure',
      success: false,
      failureReason: 'invalid_state',
    });
    return redirectToCallback(res, null, { google_error: 'invalid_state' });
  }

  const { tenant, mode, redirect: redirectTarget, utm } = statePayload;

  // Exchange code → tokens → verified ID-token payload
  let profile;
  try {
    const client = oauth();
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    profile = ticket.getPayload();
  } catch (err) {
    console.error('Google token exchange error:', err.message);
    await logLoginEvent({
      req,
      provider: 'google',
      eventType: 'login_failure',
      success: false,
      failureReason: 'token_exchange_failed',
      tenantId: tenant,
    });
    return redirectToCallback(res, tenant, { google_error: 'token_exchange_failed' });
  }

  const { sub: googleSub, email, name, picture, email_verified } = profile;
  if (!email || !email_verified) {
    await logLoginEvent({
      req,
      provider: 'google',
      eventType: 'login_failure',
      success: false,
      failureReason: 'email_not_verified',
      tenantId: tenant,
      email,
      googleProfile: profile,
    });
    return redirectToCallback(res, tenant, { google_error: 'email_not_verified' });
  }

  const normalizedEmail = email.toLowerCase();

  // findOrCreateOAuthUser
  let user = null;
  let linkedExisting = false;

  // 1) Match på googleId
  user = await prisma.user.findUnique({ where: { googleId: googleSub } });
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleProfile: profile,
        avatarUrl: picture || user.avatarUrl,
      },
    });
  } else {
    // 2) Match på email → auto-link
    const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: googleSub,
          googleProfile: profile,
          avatarUrl: picture || byEmail.avatarUrl,
        },
      });
      linkedExisting = true;
    } else {
      // 3) Ny bruker — opprett fra Google-profil
      // StartMarket har ingen invite-gating (ulikt helptruth) — åpen registrering.
      // KYC kreves separat for sensitive operasjoner (bid accept, listing publish).
      const fullName = name || normalizedEmail.split('@')[0];
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName,
          googleId: googleSub,
          googleProfile: profile,
          avatarUrl: picture || null,
          authProvider: 'google',
        },
      });

      await logLoginEvent({
        req,
        userId: user.id,
        email: user.email,
        provider: 'google',
        eventType: 'register',
        success: true,
        tenantId: tenant,
        googleProfile: profile,
        utm,
      });
    }
  }

  // Utsted JWT
  const token = makeToken(user.id);

  await logLoginEvent({
    req,
    userId: user.id,
    email: user.email,
    provider: 'google',
    eventType: 'login_success',
    success: true,
    tenantId: tenant,
    googleProfile: profile,
    utm,
  });

  const callbackParams = { token, provider: 'google' };
  if (linkedExisting) callbackParams.linked = '1';
  if (redirectTarget) callbackParams.redirect = redirectTarget;
  redirectToCallback(res, tenant, callbackParams);
});

module.exports = router;
