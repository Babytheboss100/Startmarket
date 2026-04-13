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
