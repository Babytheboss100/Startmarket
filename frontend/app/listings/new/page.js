'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgNr, setOrgNr] = useState('');
  const [company, setCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeoutId] = useState(null);
  const [form, setForm] = useState({ sharesForSale: '', totalShares: '', priceType: 'FIXED', askingPricePerShare: '', description: '' });
  const [shareholders, setShareholders] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchCompanies = (query) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (query.length < 2) { setSearchResults([]); return; }
    const tid = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get(`/api/companies/search`, { params: { name: query } });
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    setSearchTimeoutId(tid);
  };

  const selectCompany = async (result) => {
    setCompany(result);
    setOrgNr(result.organisasjonsnummer);
    setSearchResults([]);
    setSearchQuery(result.navn);
    try {
      const { data } = await api.get(`/api/companies/${result.organisasjonsnummer}/shareholders`);
      setShareholders(data);
      if (data.length > 0 && data[0].totalShares > 0) {
        setForm(f => ({ ...f, totalShares: String(data[0].totalShares) }));
      }
    } catch {
      setShareholders([]);
    }
    setStep(2);
  };

  const submitListing = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/listings', {
        companyOrgNr: company?.organisasjonsnummer || orgNr.replace(/\s/g, ''),
        sharesForSale: form.sharesForSale,
        totalShares: form.totalShares,
        priceType: form.priceType,
        askingPricePerShare: form.priceType === 'FIXED' ? form.askingPricePerShare : null,
        description: form.description
      });
      router.push(`/listings/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Noe gikk galt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: 600, padding: '40px 24px' }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>List aksjer for salg</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: 32 }}>Steg {step} av 3</p>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--accent)' : 'var(--gray-200)' }} />
          ))}
        </div>

        {step === 1 && (
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Finn selskapet</h2>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Søk etter selskapsnavn</label>
              <input className="form-input" placeholder="Skriv selskapsnavn..." value={searchQuery} onChange={e => searchCompanies(e.target.value)} autoFocus />
              <span className="form-hint">Søker i Brønnøysundregisteret</span>
              {searchLoading && <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Søker...</div>}
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', marginTop: 4, maxHeight: 280, overflowY: 'auto' }}>
                  {searchResults.map(r => (
                    <button key={r.organisasjonsnummer} onClick={() => selectCompany(r)} style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <div style={{ fontWeight: 500 }}>{r.navn}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Org.nr: {r.organisasjonsnummer}{r.naeringskode1?.beskrivelse ? ` · ${r.naeringskode1.beskrivelse}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Ingen treff</div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{company?.navn}</h2>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20 }}>
              {company?.naeringskode1?.beskrivelse} &middot; {company?.antallAnsatte || 0} ansatte
            </p>
            <div className="form-group">
              <label className="form-label">Antall aksjer til salgs</label>
              <input className="form-input" type="number" required value={form.sharesForSale} onChange={e => setForm({ ...form, sharesForSale: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Totalt antall aksjer i selskapet</label>
              <input className="form-input" type="number" required value={form.totalShares} onChange={e => setForm({ ...form, totalShares: e.target.value })} />
              {shareholders.length > 0 && form.totalShares && <span className="form-hint">Hentet fra aksjonærregisteret</span>}
            </div>
            {shareholders.length > 0 && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Aksjonærer ({shareholders.length})</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--gray-200)', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px' }}>Navn</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Aksjer</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Andel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareholders.map((sh, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '4px 6px', color: 'var(--gray-700)' }}>{sh.name}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{sh.shares.toLocaleString('nb-NO')}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{sh.totalShares > 0 ? ((sh.shares / sh.totalShares) * 100).toFixed(1) : '—'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Prismodell</label>
              <select className="form-input" value={form.priceType} onChange={e => setForm({ ...form, priceType: e.target.value })}>
                <option value="FIXED">Fast pris</option>
                <option value="OPEN">Åpen for bud</option>
              </select>
            </div>
            {form.priceType === 'FIXED' && (
              <div className="form-group">
                <label className="form-label">Pris per aksje (NOK)</label>
                <input className="form-input" type="number" step="0.01" value={form.askingPricePerShare} onChange={e => setForm({ ...form, askingPricePerShare: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Beskrivelse</label>
              <textarea className="form-input" rows={4} placeholder="Beskriv hvorfor du selger, selskapets situasjon, etc." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Tilbake</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)} disabled={!form.sharesForSale || !form.totalShares}>Neste</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Bekreft listing</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20, fontSize: 14 }}>
              <div style={{ marginBottom: 8 }}><b>Selskap:</b> {company?.navn}</div>
              <div style={{ marginBottom: 8 }}><b>Org.nr:</b> {company?.organisasjonsnummer || orgNr}</div>
              <div style={{ marginBottom: 8 }}><b>Aksjer til salgs:</b> {parseInt(form.sharesForSale).toLocaleString('nb-NO')}</div>
              <div style={{ marginBottom: 8 }}><b>Totale aksjer:</b> {parseInt(form.totalShares).toLocaleString('nb-NO')}</div>
              <div style={{ marginBottom: 8 }}><b>Andel:</b> {((form.sharesForSale / form.totalShares) * 100).toFixed(1)}%</div>
              <div style={{ marginBottom: 8 }}><b>Prismodell:</b> {form.priceType === 'FIXED' ? 'Fast pris' : 'Åpen for bud'}</div>
              {form.priceType === 'FIXED' && form.askingPricePerShare && (
                <>
                  <div style={{ marginBottom: 8 }}><b>Pris/aksje:</b> NOK {parseFloat(form.askingPricePerShare).toLocaleString('nb-NO')}</div>
                  <div><b>Total verdi:</b> NOK {(parseFloat(form.askingPricePerShare) * parseInt(form.sharesForSale)).toLocaleString('nb-NO')}</div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>Tilbake</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitListing} disabled={submitting}>
                {submitting ? 'Oppretter...' : 'Opprett listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
