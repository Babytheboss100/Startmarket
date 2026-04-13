'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { isLoggedIn, getUser } from '../../lib/auth';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    const user = getUser();
    if (user?.role !== 'ADMIN') { router.push('/dashboard'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, l] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/listings')
      ]);
      setStats(s.data);
      setUsers(u.data);
      setListings(l.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateKyc = async (userId, kycStatus) => {
    try {
      await api.patch(`/api/admin/users/${userId}/kyc`, { kycStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, kycStatus } : u));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <><Navbar /><div className="container" style={{ padding: 40, textAlign: 'center' }}>Laster admin...</div></>;

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <h1 className="page-title" style={{ marginBottom: 24 }}>Admin</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {['stats', 'users', 'listings'].map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
              {t === 'stats' ? 'Statistikk' : t === 'users' ? 'Brukere' : 'Listings'}
            </button>
          ))}
        </div>

        {/* Stats */}
        {tab === 'stats' && stats && (
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Brukere</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.users}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Listings</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.listings}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Bud</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.bids}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Deal Rooms</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.dealRooms}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Volum</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>NOK {Number(stats.totalVolume).toLocaleString('nb-NO')}</div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Navn</th>
                  <th style={{ padding: '8px 12px' }}>E-post</th>
                  <th style={{ padding: '8px 12px' }}>KYC</th>
                  <th style={{ padding: '8px 12px' }}>Rolle</th>
                  <th style={{ padding: '8px 12px' }}>Registrert</th>
                  <th style={{ padding: '8px 12px' }}>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{u.fullName}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--gray-600)' }}>{u.email}</td>
                    <td style={{ padding: '8px 12px' }}><span className={`badge badge-${u.kycStatus?.toLowerCase()}`}>{u.kycStatus}</span></td>
                    <td style={{ padding: '8px 12px' }}><span className="badge badge-draft">{u.role}</span></td>
                    <td style={{ padding: '8px 12px', color: 'var(--gray-600)' }}>{new Date(u.createdAt).toLocaleDateString('nb-NO')}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {u.kycStatus === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white', padding: '4px 10px', fontSize: 12 }} onClick={() => updateKyc(u.id, 'VERIFIED')}>Godkjenn</button>
                          <button className="btn btn-sm btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => updateKyc(u.id, 'REJECTED')}>Avslå</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Selskap</th>
                  <th style={{ padding: '8px 12px' }}>Selger</th>
                  <th style={{ padding: '8px 12px' }}>Aksjer</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Bud</th>
                  <th style={{ padding: '8px 12px' }}>Opprettet</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{l.company?.name}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--gray-600)' }}>{l.seller?.fullName}</td>
                    <td style={{ padding: '8px 12px' }}>{l.sharesForSale.toLocaleString('nb-NO')}</td>
                    <td style={{ padding: '8px 12px' }}><span className={`badge badge-${l.status?.toLowerCase()}`}>{l.status}</span></td>
                    <td style={{ padding: '8px 12px' }}>{l._count?.bids || 0}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--gray-600)' }}>{new Date(l.createdAt).toLocaleDateString('nb-NO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
