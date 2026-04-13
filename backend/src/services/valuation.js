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
