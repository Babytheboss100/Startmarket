export const DEFAULT_TENANT_ID = 'breedz';

export const TENANTS = {
  breedz: {
    id: 'breedz',
    brandName: 'BREEDZ Marketplace',
    logoPath: '/breedz-logo.png',
    insightsLabel: 'BreedzInsights',
    insightsFeatureTitle: 'Offentlige datapunkter',
    insightsFeatureDesc: 'Strukturerte data fra Brønnøysundregisteret og årsregnskap, tilgjengelige på én plass. Du tolker tallene selv.',
    disclaimer: 'BREEDZ Marketplace tilbyr kun informasjons- og markedsplasstjenester. Dette er ikke investeringsrådgivning. Konsulter en autorisert rådgiver før du tar investeringsbeslutninger.',
    footerBrand: 'Help Holding AS – BREEDZ Marketplace'
  },
  startmarket: {
    id: 'startmarket',
    brandName: 'StartMarket',
    logoPath: '/breedz-logo.png',
    insightsLabel: 'StartInsights',
    insightsFeatureTitle: 'Offentlige datapunkter',
    insightsFeatureDesc: 'Strukturerte data fra Brønnøysundregisteret og årsregnskap, tilgjengelige på én plass. Du tolker tallene selv.',
    disclaimer: 'StartMarket tilbyr kun informasjons- og markedsplasstjenester. Dette er ikke investeringsrådgivning. Konsulter en autorisert rådgiver før du tar investeringsbeslutninger.',
    footerBrand: 'Help Holding AS – StartMarket'
  }
};

export function resolveTenant({ host, tenantParam }) {
  if (tenantParam && TENANTS[tenantParam]) return TENANTS[tenantParam];
  const h = (host || '').toLowerCase();
  if (h.includes('startmarket.no') || h.startsWith('startmarket.')) return TENANTS.startmarket;
  if (h.includes('marketplace.breedz.eu') || h.includes('breedz')) return TENANTS.breedz;
  return TENANTS[DEFAULT_TENANT_ID];
}
