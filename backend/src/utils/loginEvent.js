// utils/loginEvent.js
// Skriver rader til LoginEvent-tabellen. Kolonner holdes identiske med
// helptruths login_events-tabell slik at data kan merges hvis vi
// sentraliserer auth senere.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseReq(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0]
    .trim() || null;
  const userAgent = req.headers['user-agent'] || '';
  const country = req.headers['cf-ipcountry'] || null;
  const referer = req.headers.referer || req.headers.referrer || null;
  return { ip, userAgent, country, referer };
}

async function logLoginEvent({
  req,
  userId = null,
  email = null,
  provider,
  eventType,
  success,
  failureReason = null,
  tenantId = null,
  googleProfile = null,
  utm = {},
  deviceFingerprint = null,
}) {
  const { ip, userAgent, country, referer } = parseReq(req);
  try {
    await prisma.loginEvent.create({
      data: {
        userId,
        email: email ? email.toLowerCase() : null,
        provider,
        eventType,
        success,
        failureReason,
        ipAddress: ip,
        userAgent,
        country,
        tenantId,
        googleProfile: googleProfile || undefined,
        referer,
        utmSource: utm?.source || null,
        utmMedium: utm?.medium || null,
        utmCampaign: utm?.campaign || null,
        deviceFingerprint,
      },
    });
  } catch (err) {
    console.error('LoginEvent insert error:', err.message);
  }
}

module.exports = { logLoginEvent, parseReq };
