#!/usr/bin/env node
/**
 * Import aksjonærregisteret fra CSV (semikolon-separert, UTF-8 BOM)
 *
 * Bruk: node scripts/import-shareholders.js <csv-fil> [--year 2024] [--clear] [--resume N]
 *
 * Kolonner: Orgnr;Selskap;Aksjeklasse;Navn aksjonær;Fødselsår/orgnr;Postnr/sted;Landkode;Antall aksjer;Antall aksjer selskap
 */

require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const BATCH_SIZE = 500;
const RECONNECT_EVERY = 30;

function newPrisma() {
  return new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: null, year: 2024, clear: false, resume: 0 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year' && args[i + 1]) { opts.year = parseInt(args[++i]); }
    else if (args[i] === '--clear') { opts.clear = true; }
    else if (args[i] === '--resume' && args[i + 1]) { opts.resume = parseInt(args[++i]); }
    else if (!args[i].startsWith('--')) { opts.file = args[i]; }
  }
  return opts;
}

function parseCsv(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const header = lines[0].split(';').map(h => h.trim());

  console.log(`Kolonner funnet: ${header.join(', ')}`);
  console.log(`Totalt ${lines.length - 1} rader å importere\n`);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map(c => c.trim());
    if (cols.length < 9) continue;

    rows.push({
      orgNr: cols[0].replace(/\s/g, ''),
      companyName: cols[1],
      shareClass: cols[2] || null,
      name: cols[3],
      birthYearOrOrg: cols[4] || null,
      postalInfo: cols[5] || null,
      countryCode: cols[6] || null,
      shares: BigInt(cols[7] || '0'),
      totalShares: BigInt(cols[8] || '0')
    });
  }
  return rows;
}

async function importBatch(prisma, rows, year) {
  const data = rows.map(r => ({ ...r, year }));
  await prisma.shareholder.createMany({ data, skipDuplicates: true });
}

async function main() {
  const opts = parseArgs();

  if (!opts.file) {
    console.error('Bruk: node scripts/import-shareholders.js <csv-fil> [--year 2024] [--clear] [--resume N]');
    process.exit(1);
  }

  if (!fs.existsSync(opts.file)) {
    console.error(`Filen finnes ikke: ${opts.file}`);
    process.exit(1);
  }

  console.log('=== StartMarket Aksjonærregister Import ===\n');
  console.log(`Fil: ${opts.file}`);
  console.log(`År: ${opts.year}`);
  console.log(`Batch: ${BATCH_SIZE} rader, reconnect hver ${RECONNECT_EVERY}. batch`);

  const rows = parseCsv(opts.file);

  if (rows.length === 0) {
    console.log('Ingen rader å importere.');
    process.exit(0);
  }

  let prisma = newPrisma();

  if (opts.clear && opts.resume === 0) {
    console.log('\nSletter eksisterende data...');
    const deleted = await prisma.shareholder.deleteMany({ where: { year: opts.year } });
    console.log(`  Slettet ${deleted.count} eksisterende rader for ${opts.year}`);
  }

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  const startBatch = opts.resume;
  console.log(`\nImporterer ${rows.length} aksjonærer i ${totalBatches} batcher...`);
  if (startBatch > 0) console.log(`Fortsetter fra batch ${startBatch + 1}`);
  console.log('');

  const start = Date.now();
  let imported = 0;

  for (let i = startBatch; i < totalBatches; i++) {
    // Reconnect periodically to avoid Render timeout
    if (i > startBatch && (i - startBatch) % RECONNECT_EVERY === 0) {
      await prisma.$disconnect();
      prisma = newPrisma();
    }

    const batch = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await importBatch(prisma, batch, opts.year);
        imported += batch.length;
        const pct = Math.round(((i + 1) / totalBatches) * 100);
        process.stdout.write(`\r  Batch ${i + 1}/${totalBatches} (${pct}%) – ${imported} rader importert`);
        break;
      } catch (err) {
        if (attempt === 5) {
          console.error(`\n\nFeilet på batch ${i + 1} etter 5 forsøk.`);
          console.error(`Kjør på nytt med: --resume ${i}`);
          console.error(`Feil: ${err.message}`);
          await prisma.$disconnect();
          process.exit(1);
        }
        const wait = attempt * 3;
        process.stdout.write(`\n  Batch ${i + 1} forsøk ${attempt}/5 feilet, venter ${wait}s...`);
        try { await prisma.$disconnect(); } catch {}
        await new Promise(r => setTimeout(r, wait * 1000));
        prisma = newPrisma();
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const count = await prisma.shareholder.count({ where: { year: opts.year } });

  console.log(`\n\nFerdig! ${count} aksjonærer i databasen (${elapsed}s)`);

  const companies = await prisma.shareholder.groupBy({
    by: ['orgNr'],
    where: { year: opts.year },
    _count: true
  });
  console.log(`Unike selskaper: ${companies.length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('\nFeil:', err.message);
  process.exit(1);
});
