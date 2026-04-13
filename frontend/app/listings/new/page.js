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
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [form, setForm] = useState({ sharesForSale: '', totalShares: '', priceType: 'FIXED', askingPricePerShare: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const lookupCompany = async () => {
    setLookupError('');
    setLookupLoading(true);
    try {
      const { data } = await api.get(`/api/companies/lookup/${orgNr.replace(/\s/g, '')}`);
      setCompany(data);
      setStep(2);
    } catch {
      setLookupError('Fant ikke selskapet. Sjekk org.nr og prøv igjen.');
    } finally {
      setLookupLoading(false);
    }
  };

  const submitListing = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/listings', {
        companyOrgNr: orgNr.replace(/\s/g, ''),
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
            {lookupError && <div className="alert alert-error">{lookupError}</div>}
            <div className="form-group">
              <label className="form-label">Organisasjonsnummer</label>
              <input className="form-input" placeholder="123 456 789" value={orgNr} onChange={e => setOrgNr(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupCompany()} />
              <span className="form-hint">9-sifret org.nr fra Brønnøysundregisteret</span>
            </div>
            <button className="btn btn-primary btn-full" onClick={lookupCompany} disabled={lookupLoading || orgNr.replace(/\s/g, '').length < 9}>
              {lookupLoading ? 'Søker...' : 'Søk opp selskap'}
            </button>
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
            </div>
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
              <div style={{ marginBottom: 8 }}><b>Org.nr:</b> {orgNr}</div>
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
