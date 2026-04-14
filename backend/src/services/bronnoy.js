const axios = require('axios');
const ENHET_BASE = 'https://data.brreg.no/enhetsregisteret/api';
const REGN_BASE = 'https://data.brreg.no/regnskapsregisteret/regnskap';

async function fetchCompany(orgNr) {
  const clean = orgNr.replace(/\s/g, '');
  const { data } = await axios.get(`${ENHET_BASE}/enheter/${clean}`);
  return data;
}

async function fetchAccounting(orgNr) {
  const clean = orgNr.replace(/\s/g, '');
  try {
    const { data } = await axios.get(`${REGN_BASE}/${clean}`);
    const list = Array.isArray(data) ? data : data?._embedded?.regnskaper || [];
    if (list.length === 0) return null;
    // Sort by year descending, pick latest
    list.sort((a, b) => (b.regnskapsperiode?.fraDato || '').localeCompare(a.regnskapsperiode?.fraDato || ''));
    const latest = list[0];
    const ri = latest.resultatregnskapResultat || {};
    const b = latest.eiendpieler || latest.balanse || {};
    return {
      year: latest.regnskapsperiode?.fraDato ? parseInt(latest.regnskapsperiode.fraDato.substring(0, 4)) : null,
      revenue: ri.driftsresultat?.driftsinntekter?.sumDriftsinntekter ?? ri.sumInntekter ?? null,
      profit: ri.ordinaertResultatFoerSkattekostnad ?? ri.resultatFoerSkattekostnad ?? null,
      equity: b.sumEgenkapital ?? null,
      debt: b.sumGjeld ?? null,
      raw: latest
    };
  } catch {
    return null;
  }
}

async function fetchRoles(orgNr) {
  const clean = orgNr.replace(/\s/g, '');
  try {
    const { data } = await axios.get(`${ENHET_BASE}/enheter/${clean}/roller`);
    const roles = data?._embedded?.roller || data?.rollegrupper || [];
    const members = [];
    for (const group of (Array.isArray(roles) ? roles : [])) {
      const type = group.type?.kode || group.type?.beskrivelse || group.rolle?.beskrivelse || '';
      const persons = group.roller || group.personer || [];
      for (const p of (Array.isArray(persons) ? persons : [])) {
        const name = p.person ? `${p.person.navn?.fornavn || ''} ${p.person.navn?.etternavn || ''}`.trim() : p.organisasjon?.organisasjonsnavn || p.navn || '';
        if (name) members.push({ role: type, name });
      }
    }
    return members;
  } catch {
    return [];
  }
}

async function fetchFullCompanyData(orgNr) {
  const clean = orgNr.replace(/\s/g, '');
  const [enhet, accounting, roles] = await Promise.all([
    fetchCompany(clean),
    fetchAccounting(clean),
    fetchRoles(clean)
  ]);

  const addr = enhet.forretningsadresse || enhet.postadresse;
  const address = addr ? [addr.adresse?.join(', '), addr.postnummer, addr.poststed].filter(Boolean).join(' ') : null;

  return {
    orgNr: clean,
    name: enhet.navn,
    industry: enhet.naeringskode1?.beskrivelse || null,
    employees: enhet.antallAnsatte || null,
    foundedYear: enhet.stiftelsesdato ? parseInt(enhet.stiftelsesdato.substring(0, 4)) : null,
    orgForm: enhet.organisasjonsform?.beskrivelse || null,
    vatRegistered: enhet.registrertIMvaregisteret || false,
    isBankrupt: enhet.konkurs || enhet.underAvvikling || enhet.underTvangsavviklingEllerTvangsopplosning || false,
    address,
    latestRevenue: accounting?.revenue ?? null,
    latestProfit: accounting?.profit ?? null,
    latestEquity: accounting?.equity ?? null,
    latestDebt: accounting?.debt ?? null,
    accountingYear: accounting?.year ?? null,
    boardMembers: roles.length > 0 ? roles : null,
    bronnoyData: enhet
  };
}

async function searchCompany(name) {
  const { data } = await axios.get(`${ENHET_BASE}/enheter`, { params: { navn: name, size: 10 } });
  return data._embedded?.enheter || [];
}

module.exports = { fetchCompany, fetchAccounting, fetchRoles, fetchFullCompanyData, searchCompany };
