#!/usr/bin/env node
/**
 * Import aksjonærregisteret fra CSV (semikolon-separert, UTF-8 BOM)
 *
 * Bruk: node scripts/import-shareholders.js <csv-fil> [--year 2024] [--clear]
 *
 * Kolonner: Orgnr;Selskap;Aksjeklasse;Navn aksjonær;Fødselsår/orgnr;Postnr/sted;Landkode;Antall aksjer;Antall aksjer selskap
 */

require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BATCH_SIZE = 1000;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: null, year: 2024, clear: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year' && args[i + 1]) { opts.year = parseInt(args[++i]); }
    else if (args[i] === '--clear') { opts.clear = true; }
    else if (!args[i].startsWith('--')) { opts.file = args[i]; }
  }
  return opts;
}

function parseCsv(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Strip UTF-8 BOM
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
      shares: parseInt(cols[7]) || 0,
      totalShares: parseInt(cols[8]) || 0
    });
  }
  return rows;
}

async function importBatch(rows, year, batchNum, totalBatches) {
  const data = rows.map(r => ({ ...r, year }));
  await prisma.shareholder.createMany({ data, skipDuplicates: true });
  const pct = Math.round((batchNum / totalBatches) * 100);
  process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} (${pct}%) – ${batchNum * BATCH_SIZE} rader behandlet`);
}

async function main() {
  const opts = parseArgs();

  if (!opts.file) {
    console.error('Bruk: node scripts/import-shareholders.js <csv-fil> [--year 2024] [--clear]');
    process.exit(1);
  }

  if (!fs.existsSync(opts.file)) {
    console.error(`Filen finnes ikke: ${opts.file}`);
    process.exit(1);
  }

  console.log('=== StartMarket Aksjonærregister Import ===\n');
  console.log(`Fil: ${opts.file}`);
  console.log(`År: ${opts.year}`);

  const rows = parseCsv(opts.file);

  if (rows.length === 0) {
    console.log('Ingen rader å importere.');
    process.exit(0);
  }

  if (opts.clear) {
    console.log('\nSletter eksisterende data...');
    const deleted = await prisma.shareholder.deleteMany({ where: { year: opts.year } });
    console.log(`  Slettet ${deleted.count} eksisterende rader for ${opts.year}`);
  }

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  console.log(`\nImporterer ${rows.length} aksjonærer i ${totalBatches} batcher...\n`);

  const start = Date.now();

  for (let i = 0; i < totalBatches; i++) {
    const batch = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    await importBatch(batch, opts.year, i + 1, totalBatches);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const count = await prisma.shareholder.count({ where: { year: opts.year } });

  console.log(`\n\nFerdig! ${count} aksjonærer importert på ${elapsed}s`);

  // Stats
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
