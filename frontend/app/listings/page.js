'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';

function ScoreBadge({ score }) {
  if (!score && score !== 0) return null;
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#2563eb' : '#d97706';
  const bg = score >= 70 ? '#dcfce7' : score >= 40 ? '#eff6ff' : '#fef3c7';
  return <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>{score}</span>;
}

function ListingCard({ listing }) {
  const company = listing.company;
  const score = company?.valuations?.[0]?.startScore;
  const price = listing.askingPricePerShare ? Number(listing.askingPricePerShare).toLocaleString('nb-NO') : 'Åpen';
  const total = listing.askingPricePerShare ? (Number(listing.askingPricePerShare) * listing.sharesForSale).toLocaleString('nb-NO') : '—';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{company?.name || 'Ukjent'}</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>{company?.industry || 'Ingen bransje'}</p>
        </div>
        <ScoreBadge score={score} />
      </div>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-label">Aksjer</div>
          <div className="stat-value">{listing.sharesForSale.toLocaleString('nb-NO')}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Pris/aksje</div>
          <div className="stat-value">{price}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Bud</div>
          <div className="stat-value">{listing._count?.bids || 0}</div>
        </div>
      </div>
      <Link href={`/listings/${listing.id}`}><button className="btn btn-primary btn-full btn-sm">Se detaljer</button></Link>
    </div>
  );
}

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ industry: '', minPrice: '', maxPrice: '' });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.industry) params.industry = filters.industry;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      const { data } = await api.get('/api/listings', { params });
      setListings(data.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="page-header">
          <h1 className="page-title">Markedsplass</h1>
          <Link href="/listings/new"><button className="btn btn-primary">+ List aksjer</button></Link>
        </div>

        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label">Bransje</label>
            <input className="form-input" placeholder="F.eks. Teknologi" value={filters.industry} onChange={e => setFilters({ ...filters, industry: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
            <label className="form-label">Min pris/aksje</label>
            <input className="form-input" type="number" placeholder="0" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
            <label className="form-label">Maks pris/aksje</label>
            <input className="form-input" type="number" placeholder="1000000" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={fetchListings}>Filtrer</button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>Laster...</p>
        ) : listings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ fontSize: 16, color: 'var(--gray-600)' }}>Ingen aktive listings funnet</p>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </>
  );
}
