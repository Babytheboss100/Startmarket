'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';
import { isLoggedIn } from '../../../lib/auth';
import { calculateFees } from '../../../lib/fees';

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ pricePerShare: '', sharesWanted: '', message: '' });
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState('');
  const [bidError, setBidError] = useState('');
  const [shareholders, setShareholders] = useState([]);

  useEffect(() => {
    api.get(`/api/listings/${id}`).then(r => {
      setListing(r.data);
      if (r.data?.company?.orgNr) {
        api.get(`/api/companies/${r.data.company.orgNr}/shareholders`).then(s => setShareholders(s.data)).catch(() => {});
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const totalBid = (parseFloat(bidForm.pricePerShare) || 0) * (parseInt(bidForm.sharesWanted) || 0);
  const fees = calculateFees(totalBid);

  const submitBid = async (e) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');
    setBidLoading(true);
    try {
      await api.post('/api/bids', { listingId: id, ...bidForm });
      setBidSuccess('Budet ditt er sendt!');
      setBidForm({ pricePerShare: '', sharesWanted: '', message: '' });
    } catch (err) {
      setBidError(err.response?.data?.error || 'Kunne ikke sende bud');
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) return <><Navbar /><div className="container" style={{ padding: 40, textAlign: 'center' }}>Laster...</div></>;
  if (!listing) return <><Navbar /><div className="container" style={{ padding: 40, textAlign: 'center' }}>Listing ikke funnet</div></>;

  const company = listing.company;
  const valuation = company?.valuations?.[0];
  const methodology = valuation?.methodology;
  const score = valuation?.startScore || methodology?.startScore;
  const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#2563eb' : '#d97706';

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>{company?.name}</h1>
              {company?.isBankrupt && <span className="badge badge-cancelled">Konkurs/Avvikling</span>}
            </div>
            <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 4 }}>
              {company?.industry || 'Ingen bransje'} &middot; Org.nr: {company?.orgNr}
              {company?.orgForm ? ` · ${company.orgForm}` : ''}
            </p>
            {company?.address && <p style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 12 }}>{company.address}</p>}
            {listing.description && <p style={{ color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: 16 }}>{listing.description}</p>}

            {/* Listing stats */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Aksjehandel</div>
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              <div className="stat-box"><div className="stat-label">Aksjer til salgs</div><div className="stat-value">{listing.sharesForSale.toLocaleString('nb-NO')}</div></div>
              <div className="stat-box"><div className="stat-label">Totale aksjer</div><div className="stat-value">{listing.totalShares.toLocaleString('nb-NO')}</div></div>
              <div className="stat-box"><div className="stat-label">Pris/aksje</div><div className="stat-value">{listing.askingPricePerShare ? `NOK ${Number(listing.askingPricePerShare).toLocaleString('nb-NO')}` : 'Åpen'}</div></div>
              <div className="stat-box"><div className="stat-label">Andel</div><div className="stat-value">{((listing.sharesForSale / listing.totalShares) * 100).toFixed(1)}%</div></div>
              <div className="stat-box"><div className="stat-label">Bud</div><div className="stat-value">{listing._count?.bids || 0}</div></div>
            </div>

            {/* Company details */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Selskapsinfo</div>
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              {company?.foundedYear && <div className="stat-box"><div className="stat-label">Stiftet</div><div className="stat-value">{company.foundedYear}</div></div>}
              {company?.employees != null && <div className="stat-box"><div className="stat-label">Ansatte</div><div className="stat-value">{company.employees}</div></div>}
              {company?.orgForm && <div className="stat-box"><div className="stat-label">Org.form</div><div className="stat-value" style={{ fontSize: 13 }}>{company.orgForm}</div></div>}
              <div className="stat-box"><div className="stat-label">MVA-registrert</div><div className="stat-value">{company?.vatRegistered ? 'Ja' : 'Nei'}</div></div>
            </div>

            {/* Financials */}
            {(company?.latestRevenue != null || company?.latestProfit != null) && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Regnskap{company?.accountingYear ? ` ${company.accountingYear}` : ''}
                </div>
                <div className="stat-grid">
                  {company?.latestRevenue != null && <div className="stat-box"><div className="stat-label">Omsetning</div><div className="stat-value">NOK {Number(company.latestRevenue).toLocaleString('nb-NO')}</div></div>}
                  {company?.latestProfit != null && <div className="stat-box"><div className="stat-label">Resultat</div><div className="stat-value" style={{ color: Number(company.latestProfit) >= 0 ? 'var(--success)' : 'var(--danger)' }}>NOK {Number(company.latestProfit).toLocaleString('nb-NO')}</div></div>}
                  {company?.latestEquity != null && <div className="stat-box"><div className="stat-label">Egenkapital</div><div className="stat-value">NOK {Number(company.latestEquity).toLocaleString('nb-NO')}</div></div>}
                  {company?.latestDebt != null && <div className="stat-box"><div className="stat-label">Gjeld</div><div className="stat-value">NOK {Number(company.latestDebt).toLocaleString('nb-NO')}</div></div>}
                </div>
              </>
            )}

            {/* Board members */}
            {company?.boardMembers && company.boardMembers.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Roller</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {company.boardMembers.map((m, i) => (
                    <span key={i} style={{ fontSize: 12, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '4px 10px' }}>
                      <span style={{ fontWeight: 500 }}>{m.name}</span> <span style={{ color: 'var(--gray-400)' }}>{m.role}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shareholders */}
          {shareholders.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Aksjonærer</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Navn</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Aksjer</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Andel</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((sh, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '6px 8px' }}>{sh.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{sh.shares.toLocaleString('nb-NO')}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{sh.totalShares > 0 ? ((sh.shares / sh.totalShares) * 100).toFixed(1) : '—'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* StartScore card */}
          {score && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: scoreColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: scoreColor }}>{score}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>StartScore</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{score >= 70 ? 'Sterk posisjon' : score >= 40 ? 'God posisjon' : 'Gjennomsnitt'}</div>
                </div>
              </div>
              {methodology?.scoreExplanation && <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>{methodology.scoreExplanation}</p>}
              {methodology?.keyStrengths && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Styrker</div>
                  {methodology.keyStrengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--gray-600)', paddingLeft: 12 }}>+ {s}</div>)}
                </div>
              )}
              {methodology?.keyRisks && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Risiko</div>
                  {methodology.keyRisks.map((r, i) => <div key={i} style={{ fontSize: 13, color: 'var(--gray-600)', paddingLeft: 12 }}>- {r}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {listing.documents?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Dokumenter</h3>
              {listing.documents.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
                  <span>{d.fileName}</span>
                  <span className="badge badge-draft">{d.docType}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column - Bid form */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card">
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Legg inn bud</h3>
            {!isLoggedIn() ? (
              <div className="alert alert-info">Du må logge inn for å legge inn bud</div>
            ) : (
              <form onSubmit={submitBid}>
                {bidError && <div className="alert alert-error">{bidError}</div>}
                {bidSuccess && <div className="alert alert-success">{bidSuccess}</div>}
                <div className="form-group">
                  <label className="form-label">Pris per aksje (NOK)</label>
                  <input className="form-input" type="number" step="0.01" required value={bidForm.pricePerShare} onChange={e => setBidForm({ ...bidForm, pricePerShare: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Antall aksjer</label>
                  <input className="form-input" type="number" required max={listing.sharesForSale} value={bidForm.sharesWanted} onChange={e => setBidForm({ ...bidForm, sharesWanted: e.target.value })} />
                  <span className="form-hint">Maks {listing.sharesForSale.toLocaleString('nb-NO')}</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Melding (valgfritt)</label>
                  <textarea className="form-input" rows={3} value={bidForm.message} onChange={e => setBidForm({ ...bidForm, message: e.target.value })} />
                </div>

                {totalBid > 0 && (
                  <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--gray-600)' }}>Kjøpesum</span>
                      <span style={{ fontWeight: 500 }}>NOK {totalBid.toLocaleString('nb-NO')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--gray-600)' }}>Gebyr ({fees.ratePercent}%)</span>
                      <span style={{ fontWeight: 500 }}>NOK {fees.buyerFee.toLocaleString('nb-NO')}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 6, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Totalt</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>NOK {fees.totalForBuyer.toLocaleString('nb-NO')}</span>
                    </div>
                  </div>
                )}

                <button className="btn btn-primary btn-full" disabled={bidLoading}>
                  {bidLoading ? 'Sender bud...' : 'Send bud'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
