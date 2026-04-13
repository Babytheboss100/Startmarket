# StartMarket – CLAUDE.md

## Oppgave
Bygg StartMarket komplett fra scratch. Norsk matchmaking-plattform for handel av unoterte aksjer.
Kjør alle kommandoer selv. Ikke spør – bare bygg. Installer dependencies, push database, start servere.

## Stack
- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: Next.js 14 (App Router)
- Auth: JWT + Google OAuth + BankID via Criipto
- Betaling: Stripe
- AI: Anthropic Claude API (StartScore)
- Filer: Cloudflare R2
- E-post: Resend

## Bygg-rekkefølge
1. backend/package.json og npm install
2. prisma/schema.prisma og npx prisma db push
3. Alle backend middleware og routes
4. Alle backend services
5. frontend/package.json og npm install
6. globals.css, layout.js, Navbar
7. Landing page
8. Auth pages (login/register)
9. Marketplace /listings
10. Enkelt listing + bud /listings/[id]
11. Opprett listing /listings/new
12. Dashboard
13. Deal Room /dealrooms/[id]
14. Admin panel /admin
15. .env.example begge

---

## backend/package.json
```json
{
  "name": "startmarket-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:push": "npx prisma db push",
    "db:generate": "npx prisma generate"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@aws-sdk/client-s3": "^3.600.0",
    "@aws-sdk/s3-request-presigner": "^3.600.0",
    "@prisma/client": "^5.14.0",
    "axios": "^1.7.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "express-session": "^1.18.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "openid-client": "^5.6.5",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "resend": "^3.2.0",
    "stripe": "^15.0.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0",
    "prisma": "^5.14.0"
  }
}
```

---

## backend/src/prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum KycStatus     { PENDING VERIFIED REJECTED }
enum UserRole      { USER ADMIN }
enum ListingStatus { DRAFT ACTIVE PAUSED SOLD CANCELLED }
enum PriceType     { FIXED OPEN }
enum BidStatus     { PENDING ACCEPTED REJECTED EXPIRED WITHDRAWN }
enum DealStage     { NDA_PENDING DD_ACTIVE NEGOTIATING SIGNING COMPLETED CANCELLED }
enum DocType       { ANNUAL_REPORT PITCH_DECK CAP_TABLE SHAREHOLDER_AGREEMENT NDA SHARE_PURCHASE_AGREEMENT OTHER }

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  fullName     String
  phone        String?
  bankIdPid    String?   @unique
  googleId     String?   @unique
  passwordHash String?
  kycStatus    KycStatus @default(PENDING)
  role         UserRole  @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  listings     Listing[]
  bids         Bid[]
  dealMembers  DealRoomMember[]
  messages     DealRoomMessage[]
}

model Company {
  id          String    @id @default(uuid())
  orgNr       String    @unique
  name        String
  industry    String?
  employees   Int?
  revenue     Decimal?
  ebitda      Decimal?
  bronnoyData Json?
  lastSynced  DateTime?
  createdAt   DateTime  @default(now())
  listings    Listing[]
  valuations  AiValuation[]
}

model Listing {
  id                  String        @id @default(uuid())
  sellerId            String
  companyId           String
  sharesForSale       Int
  totalShares         Int
  askingPricePerShare Decimal?
  priceType           PriceType     @default(FIXED)
  status              ListingStatus @default(DRAFT)
  description         String?
  feePercent          Decimal       @default(5.0)
  publishedAt         DateTime?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  seller              User          @relation(fields: [sellerId], references: [id])
  company             Company       @relation(fields: [companyId], references: [id])
  bids                Bid[]
  documents           ListingDocument[]
  dealRooms           DealRoom[]
}

model Bid {
  id            String    @id @default(uuid())
  listingId     String
  buyerId       String
  pricePerShare Decimal
  sharesWanted  Int
  status        BidStatus @default(PENDING)
  message       String?
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  listing       Listing   @relation(fields: [listingId], references: [id])
  buyer         User      @relation(fields: [buyerId], references: [id])
  dealRoom      DealRoom?
}

model DealRoom {
  id              String    @id @default(uuid())
  listingId       String
  acceptedBidId   String?   @unique
  stage           DealStage @default(NDA_PENDING)
  ndaSignedSeller Boolean   @default(false)
  ndaSignedBuyer  Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  listing         Listing   @relation(fields: [listingId], references: [id])
  acceptedBid     Bid?      @relation(fields: [acceptedBidId], references: [id])
  members         DealRoomMember[]
  messages        DealRoomMessage[]
  documents       DealDocument[]
  transaction     Transaction?
}

model DealRoomMember {
  id         String   @id @default(uuid())
  dealRoomId String
  userId     String
  role       String
  dealRoom   DealRoom @relation(fields: [dealRoomId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  @@unique([dealRoomId, userId])
}

model DealRoomMessage {
  id         String   @id @default(uuid())
  dealRoomId String
  senderId   String
  content    String
  sentAt     DateTime @default(now())
  dealRoom   DealRoom @relation(fields: [dealRoomId], references: [id])
  sender     User     @relation(fields: [senderId], references: [id])
}

model ListingDocument {
  id        String   @id @default(uuid())
  listingId String
  docType   DocType
  fileUrl   String
  fileName  String
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  listing   Listing  @relation(fields: [listingId], references: [id])
}

model DealDocument {
  id         String   @id @default(uuid())
  dealRoomId String
  docType    DocType
  fileUrl    String
  fileName   String
  signed     Boolean  @default(false)
  createdAt  DateTime @default(now())
  dealRoom   DealRoom @relation(fields: [dealRoomId], references: [id])
}

model AiValuation {
  id             String   @id @default(uuid())
  companyId      String
  estimatedValue Decimal
  lowRange       Decimal
  highRange      Decimal
  startScore     Int
  methodology    Json
  generatedAt    DateTime @default(now())
  company        Company  @relation(fields: [companyId], references: [id])
}

model Transaction {
  id                String    @id @default(uuid())
  dealRoomId        String    @unique
  totalValue        Decimal
  platformFeeSeller Decimal
  platformFeeBuyer  Decimal
  status            String    @default("PENDING")
  stripePaymentId   String?
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  dealRoom          DealRoom  @relation(fields: [dealRoomId], references: [id])
}
```

---

## backend/src/index.js
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use('/auth',           require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/companies',  require('./routes/companies'));
app.use('/api/listings',   require('./routes/listings'));
app.use('/api/bids',       require('./routes/bids'));
app.use('/api/dealrooms',  require('./routes/dealrooms'));
app.use('/api/valuations', require('./routes/valuations'));
app.use('/api/admin',      require('./routes/admin'));
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`StartMarket API på port ${PORT}`));
```

---

## backend/src/middleware/auth.js
```javascript
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
```

## backend/src/middleware/errorHandler.js
```javascript
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Intern serverfeil' });
};
```

---

## backend/src/routes/auth.js
```javascript
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
```

---

## backend/src/routes/users.js
```javascript
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
```

---

## backend/src/routes/companies.js
```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bronnoy = require('../services/bronnoy');
const { generateValuation } = require('../services/valuation');
const prisma = new PrismaClient();

router.get('/lookup/:orgNr', async (req, res) => {
  try {
    const data = await bronnoy.fetchCompany(req.params.orgNr);
    res.json(data);
  } catch { res.status(404).json({ error: 'Fant ikke selskapet i Brønnøysundregisteret' }); }
});

router.get('/:orgNr', async (req, res) => {
  try {
    let company = await prisma.company.findUnique({
      where: { orgNr: req.params.orgNr },
      include: { valuations: { orderBy: { generatedAt: 'desc' }, take: 1 }, listings: { where: { status: 'ACTIVE' } } }
    });
    if (!company) {
      const data = await bronnoy.fetchCompany(req.params.orgNr);
      company = await prisma.company.create({
        data: { orgNr: req.params.orgNr, name: data.navn, industry: data.naeringskode1?.beskrivelse, employees: data.antallAnsatte, bronnoyData: data, lastSynced: new Date() },
        include: { valuations: true, listings: true }
      });
    }
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:orgNr/valuate', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { orgNr: req.params.orgNr } });
    if (!company) return res.status(404).json({ error: 'Selskap ikke funnet' });
    const valuation = await generateValuation(company.id);
    res.json(valuation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

---

## backend/src/routes/listings.js
```javascript
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
```

---

## backend/src/routes/bids.js
```javascript
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
```

---

## backend/src/routes/dealrooms.js
```javascript
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
```

---

## backend/src/routes/valuations.js
```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateValuation } = require('../services/valuation');
const prisma = new PrismaClient();

router.post('/generate', async (req, res) => {
  try {
    const valuation = await generateValuation(req.body.companyId);
    res.json(valuation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/company/:companyId', async (req, res) => {
  try {
    const valuations = await prisma.aiValuation.findMany({ where: { companyId: req.params.companyId }, orderBy: { generatedAt: 'desc' } });
    res.json(valuations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

---

## backend/src/routes/admin.js
```javascript
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
```

---

## backend/src/services/bronnoy.js
```javascript
const axios = require('axios');
const BASE = 'https://data.brreg.no/enhetsregisteret/api';

async function fetchCompany(orgNr) {
  const clean = orgNr.replace(/\s/g, '');
  const { data } = await axios.get(`${BASE}/enheter/${clean}`);
  return data;
}

async function searchCompany(name) {
  const { data } = await axios.get(`${BASE}/enheter`, { params: { navn: name, size: 5 } });
  return data._embedded?.enheter || [];
}

module.exports = { fetchCompany, searchCompany };
```

---

## backend/src/services/valuation.js
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MULTIPLES = {
  'Informasjonsteknologi': { ps: 4.5, evEbitda: 18 },
  'Finanstjenester': { ps: 3.0, evEbitda: 14 },
  'Helse': { ps: 5.0, evEbitda: 20 },
  'Eiendom': { ps: 8.0, evEbitda: 16 },
  'Konsumvarer': { ps: 1.5, evEbitda: 12 },
  'Energi': { ps: 1.2, evEbitda: 8 },
  'Industri': { ps: 1.8, evEbitda: 10 },
  default: { ps: 2.5, evEbitda: 12 }
};

async function generateValuation(companyId) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Selskap ikke funnet');

  const mult = Object.entries(MULTIPLES).find(([k]) => company.industry?.includes(k))?.[1] || MULTIPLES.default;
  let indicative = null;
  if (company.revenue) indicative = Number(company.revenue) * mult.ps;
  if (company.ebitda) {
    const ev = Number(company.ebitda) * mult.evEbitda;
    indicative = indicative ? (indicative + ev) / 2 : ev;
  }
  const discounted = indicative ? indicative * 0.75 : null;

  const prompt = `Du er en norsk næringslivsanalytiker spesialisert på verdivurdering av unoterte selskaper.

Selskap: ${company.name}
Org.nr: ${company.orgNr}
Bransje: ${company.industry || 'Ukjent'}
Ansatte: ${company.employees || 'Ukjent'}
Omsetning: ${company.revenue ? `NOK ${Number(company.revenue).toLocaleString('nb-NO')}` : 'Ikke tilgjengelig'}
EBITDA: ${company.ebitda ? `NOK ${Number(company.ebitda).toLocaleString('nb-NO')}` : 'Ikke tilgjengelig'}
Indikativ verdi (P/S, 25% illikviditetsdiscount): ${discounted ? `NOK ${Math.round(discounted).toLocaleString('nb-NO')}` : 'Ikke kalkulerbar'}
Bransje P/S-multippel: ${mult.ps}x

Svar KUN med JSON (ingen tekst utenfor):
{
  "startScore": <1-100>,
  "scoreExplanation": "<2-3 setninger på norsk>",
  "estimatedValue": <NOK tall eller null>,
  "lowRange": <NOK tall eller null>,
  "highRange": <NOK tall eller null>,
  "keyStrengths": ["<styrke>", "<styrke>"],
  "keyRisks": ["<risiko>", "<risiko>"],
  "methodology": "<1 setning>"
}

StartScore: 80-100=sterk vekst, 60-79=god posisjon, 40-59=gjennomsnitt, 20-39=svak, 1-19=høy risiko`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = JSON.parse(response.content[0].text);

  return prisma.aiValuation.create({
    data: {
      companyId,
      estimatedValue: result.estimatedValue || discounted || 0,
      lowRange: result.lowRange || 0,
      highRange: result.highRange || 0,
      startScore: result.startScore,
      methodology: result
    }
  });
}

module.exports = { generateValuation };
```

---

## backend/src/services/email.js
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'noreply@startmarket.no';
const FE = process.env.FRONTEND_URL || 'https://startmarket.no';

const btn = (url, text) => `<a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin-top:16px">${text}</a>`;

async function sendBidNotification(sellerEmail, listing, bid, buyer) {
  const total = (Number(bid.pricePerShare) * bid.sharesWanted).toLocaleString('nb-NO');
  await resend.emails.send({
    from: FROM, to: sellerEmail,
    subject: `Nytt bud – ${listing.company?.name}`,
    html: `<h2 style="color:#0f172a">Du har mottatt et nytt bud</h2>
      <p><b>Kjøper:</b> ${buyer.fullName}</p>
      <p><b>Pris/aksje:</b> NOK ${Number(bid.pricePerShare).toLocaleString('nb-NO')}</p>
      <p><b>Antall:</b> ${bid.sharesWanted.toLocaleString('nb-NO')} aksjer</p>
      <p><b>Total:</b> NOK ${total}</p>
      ${bid.message ? `<p><b>Melding:</b> ${bid.message}</p>` : ''}
      ${btn(`${FE}/listings/${listing.id}`, 'Se budet')}`
  });
}

async function sendDealRoomCreated(buyerEmail, dealRoom) {
  await resend.emails.send({
    from: FROM, to: buyerEmail,
    subject: 'Budet ditt er akseptert – Deal Room opprettet',
    html: `<h2 style="color:#0f172a">Budet ditt er akseptert!</h2>
      <p>Et Deal Room er opprettet. Neste steg: signer NDA for å få tilgang til due diligence-dokumenter.</p>
      ${btn(`${FE}/dealrooms/${dealRoom.id}`, 'Gå til Deal Room')}`
  });
}

async function sendWelcome(email, fullName) {
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Velkommen til StartMarket',
    html: `<h2 style="color:#0f172a">Velkommen, ${fullName}!</h2>
      <p>Din konto er opprettet. Fullfør KYC-verifisering for å begynne å handle.</p>
      ${btn(`${FE}/profile`, 'Kom i gang')}`
  });
}

module.exports = { sendBidNotification, sendDealRoomCreated, sendWelcome };
```

---

## backend/src/services/r2.js
```javascript
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
});

const BUCKET = process.env.R2_BUCKET_NAME;

async function uploadFile(buffer, originalName, folder = 'docs') {
  const ext = originalName.split('.').pop();
  const key = `${folder}/${uuidv4()}.${ext}`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer }));
  return { key, url: `${process.env.R2_PUBLIC_URL}/${key}` };
}

async function getPresignedUrl(key, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

async function deleteFile(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadFile, getPresignedUrl, deleteFile };
```

---

## backend/src/services/stripe.js
```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { calculateFees } = require('../utils/fees');

async function createPaymentIntent(totalValue, dealRoomId) {
  const { buyerFee } = calculateFees(totalValue);
  return stripe.paymentIntents.create({
    amount: Math.round(buyerFee * 100),
    currency: 'nok',
    metadata: { dealRoomId, type: 'platform_fee_buyer' }
  });
}

async function handleWebhook(payload, sig) {
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { createPaymentIntent, handleWebhook };
```

---

## backend/src/utils/fees.js
```javascript
function calculateFees(totalValue) {
  const rate = totalValue < 1_000_000 ? 0.05 : 0.03;
  return {
    rate,
    ratePercent: rate * 100,
    sellerFee: totalValue * rate,
    buyerFee: totalValue * rate,
    totalFee: totalValue * rate * 2,
    netToSeller: totalValue - totalValue * rate,
    totalForBuyer: totalValue + totalValue * rate
  };
}

module.exports = { calculateFees };
```

---

## backend/.env.example
```
DATABASE_URL=postgresql://user:pass@host/startmarket
JWT_SECRET=bytt-ut-med-minst-64-tegn-tilfeldig-streng
SESSION_SECRET=bytt-ut-med-minst-64-tegn-tilfeldig-streng

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.startmarket.no/auth/google/callback

CRIIPTO_DOMAIN=your-domain.criipto.id
CRIIPTO_CLIENT_ID=
CRIIPTO_CLIENT_SECRET=
CRIIPTO_CALLBACK_URL=https://api.startmarket.no/auth/bankid/callback

ANTHROPIC_API_KEY=sk-ant-...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=startmarket-docs
R2_PUBLIC_URL=https://docs.startmarket.no

RESEND_API_KEY=re_...
FROM_EMAIL=noreply@startmarket.no

FRONTEND_URL=https://startmarket.no
PORT=3001
NODE_ENV=production
```

---

## frontend/package.json
```json
{
  "name": "startmarket-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "axios": "^1.7.0",
    "js-cookie": "^3.0.5"
  }
}
```

## frontend/.env.example
```
NEXT_PUBLIC_API_URL=https://api.startmarket.no
```

---

## frontend/lib/auth.js
```javascript
import Cookies from 'js-cookie';
export const getToken = () => Cookies.get('sm_token');
export const setToken = (t) => Cookies.set('sm_token', t, { expires: 30 });
export const removeToken = () => Cookies.remove('sm_token');
export const isLoggedIn = () => !!getToken();
export const getUser = () => { try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; } };
export const setUser = (u) => localStorage.setItem('sm_user', JSON.stringify(u));
export const removeUser = () => localStorage.removeItem('sm_user');
export const logout = () => { removeToken(); removeUser(); window.location.href = '/'; };
```

## frontend/lib/api.js
```javascript
import axios from 'axios';
import { getToken, logout } from './auth';
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' });
api.interceptors.request.use(config => { const t = getToken(); if (t) config.headers.Authorization = `Bearer ${t}`; return config; });
api.interceptors.response.use(r => r, err => { if (err.response?.status === 401) logout(); return Promise.reject(err); });
export default api;
```

## frontend/lib/fees.js
```javascript
export function calculateFees(totalValue) {
  const rate = totalValue < 1_000_000 ? 0.05 : 0.03;
  return { rate, ratePercent: rate * 100, sellerFee: totalValue * rate, buyerFee: totalValue * rate, totalFee: totalValue * rate * 2, netToSeller: totalValue - totalValue * rate, totalForBuyer: totalValue + totalValue * rate };
}
```

---

## frontend/app/globals.css
```css
:root {
  --accent: #2563eb; --accent-hover: #1d4ed8; --accent-light: #eff6ff;
  --success: #16a34a; --success-light: #dcfce7;
  --danger: #dc2626; --danger-light: #fee2e2;
  --warning: #d97706; --warning-light: #fef3c7;
  --gray-50: #f8fafc; --gray-100: #f1f5f9; --gray-200: #e2e8f0;
  --gray-400: #94a3b8; --gray-600: #475569; --gray-700: #334155; --gray-900: #0f172a;
  --radius: 8px; --radius-lg: 12px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1); --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--gray-900); background: var(--gray-50); line-height: 1.6; }
a { color: var(--accent); text-decoration: none; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: var(--radius); border: none; cursor: pointer; font-size: 15px; font-weight: 500; transition: all 0.15s; white-space: nowrap; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-outline { background: transparent; border: 1.5px solid var(--gray-200); color: var(--gray-900); }
.btn-outline:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-danger { background: var(--danger); color: white; }
.btn-sm { padding: 6px 14px; font-size: 13px; }
.btn-full { width: 100%; justify-content: center; }
.card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--gray-200); padding: 24px; box-shadow: var(--shadow); }
.badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
.badge-active { background: var(--success-light); color: #15803d; }
.badge-draft { background: var(--gray-100); color: var(--gray-600); }
.badge-sold { background: var(--accent-light); color: var(--accent); }
.badge-cancelled { background: var(--danger-light); color: var(--danger); }
.badge-pending { background: var(--warning-light); color: #92400e; }
.badge-verified { background: var(--success-light); color: #15803d; }
.badge-rejected { background: var(--danger-light); color: var(--danger); }
.badge-accepted { background: var(--success-light); color: #15803d; }
.badge-withdrawn { background: var(--gray-100); color: var(--gray-600); }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-label { font-size: 14px; font-weight: 500; color: var(--gray-700); }
.form-input { padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--radius); font-size: 15px; transition: border-color 0.15s; width: 100%; font-family: inherit; }
.form-input:focus { outline: none; border-color: var(--accent); }
.form-hint { font-size: 12px; color: var(--gray-400); }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.stat-box { background: var(--gray-50); border-radius: var(--radius); padding: 10px 12px; }
.stat-label { font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.stat-value { font-size: 15px; font-weight: 600; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.page-title { font-size: 26px; font-weight: 700; }
.listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.alert { padding: 12px 16px; border-radius: var(--radius); font-size: 14px; margin-bottom: 16px; }
.alert-error { background: var(--danger-light); color: var(--danger); }
.alert-success { background: var(--success-light); color: var(--success); }
.alert-info { background: var(--accent-light); color: var(--accent); }
.alert-warning { background: var(--warning-light); color: var(--warning); }
```

## frontend/app/layout.js
```javascript
import './globals.css';
export const metadata = { title: 'StartMarket – Handel av unoterte aksjer', description: 'Norges markedsplass for kjøp og salg av unoterte aksjer' };
export default function RootLayout({ children }) {
  return <html lang="no"><body>{children}</body></html>;
}
```

## frontend/components/Navbar.js
```javascript
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isLoggedIn, getUser, logout } from '../lib/auth';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => { setLoggedIn(isLoggedIn()); setUser(getUser()); }, []);

  return (
    <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' }}>Start<span style={{ color: 'var(--accent)' }}>Market</span></Link>
        <div style={{ flex: 1 }} />
        <Link href="/listings" style={{ color: 'var(--gray-700)', fontSize: 14, fontWeight: 500 }}>Markedsplass</Link>
        {loggedIn ? (
          <>
            <Link href="/dashboard" style={{ color: 'var(--gray-700)', fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
            <Link href="/listings/new"><button className="btn btn-primary btn-sm">+ List aksjer</button></Link>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logg ut</button>
          </>
        ) : (
          <>
            <Link href="/auth/login"><button className="btn btn-outline btn-sm">Logg inn</button></Link>
            <Link href="/auth/register"><button className="btn btn-primary btn-sm">Registrer</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

---

## frontend/app/page.js
Bygg en profesjonell landing page med:
- Hero: mørk bakgrunn (#0f172a), stor headline "Kjøp og selg unoterte aksjer", CTA-knapper til /listings og /auth/register
- Stats-bar: "5% per side under 1M", "3% per side over 1M", "AI StartScore", "Norsk plattform"
- Features: 4 kort – List aksjer, AI-verdivurdering, Motta bud, Deal Room
- Prising: to kort side om side, 5% og 3%
- CTA-seksjon: blå bakgrunn, knapp til /auth/register
- Footer: "Help Holding AS – startmarket.no"

## frontend/app/auth/login/page.js
Login-skjema med email/passord. POST til /auth/login. Lagre token med setToken(), user med setUser(). Redirect til /dashboard.

## frontend/app/auth/register/page.js
Register-skjema med fullName, email, phone, password. POST til /auth/register. Lagre token/user. Redirect til /dashboard.

## frontend/app/listings/page.js
Marketplace med filter (industry, minPrice, maxPrice). Grid av ListingCard-komponenter. Hent fra GET /api/listings.
ListingCard viser: selskapsnavn, bransje, StartScore (fargekodet: grønn>=70, blå>=40, gul<40), stat-grid med aksjer/pris/total/bud, knapp til /listings/[id].

## frontend/app/listings/[id]/page.js
To-kolonne layout. Venstre: selskapsinformasjon, StartScore-kort med scoreExplanation, dokumentliste. Høyre (sticky): budskjema med pricePerShare + sharesWanted + message, live provisjonsberegner som viser kjøpesum/gebyr/totalt, send-knapp. POST til /api/bids.

## frontend/app/listings/new/page.js
3-stegs wizard:
- Steg 1: org.nr-søk, GET /api/companies/lookup/:orgNr
- Steg 2: aksjedetaljer (sharesForSale, totalShares, priceType, askingPricePerShare, description)
- Steg 3: bekreftelsesvisning + POST /api/listings

## frontend/app/dashboard/page.js
3-kolonne grid: Mine listings (med budtelling), Mine bud (med status), Mine deal rooms. Hent fra GET /api/users/me/dashboard. Vis KYC-advarsel hvis ikke VERIFIED.

## frontend/app/dealrooms/[id]/page.js
Hent fra GET /api/dealrooms/:id. Poll hvert 5 sekund for live chat.
Venstre: chat med meldingsbobler (mine høyre/blå, andres venstre/grå). Høyre: stage-tracker (5 steg med progressbar), transaksjonsinfo, NDA-signeringsknapp (POST /api/dealrooms/:id/nda), dokumentliste.

## frontend/app/admin/page.js
Tab-navigasjon: Statistikk (5 nøkkeltall), Brukere (tabell med KYC godkjenn/avslå), Listings (tabell). Krev ADMIN-rolle.

---

## DEPLOYMENT

### Render (backend)
- Runtime: Node
- Build: `cd backend && npm install && npx prisma generate`
- Start: `cd backend && node src/index.js`
- Alle .env variabler

### Vercel (frontend)
- Root: frontend/
- Framework: Next.js auto-detect
- Env: NEXT_PUBLIC_API_URL=https://<din-render-url>

### Etter deploy
1. Kopier .env.example til .env og fyll inn alle verdier
2. cd backend && npm install && npx prisma db push
3. cd frontend && npm install
4. Test lokalt: backend :3001, frontend :3000
5. Push til GitHub, koble Render + Vercel
6. Sett første bruker til ADMIN via: npx prisma studio
