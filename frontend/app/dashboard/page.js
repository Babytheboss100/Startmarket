'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { isLoggedIn, getUser } from '../../lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    api.get('/api/users/me/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <><Navbar /><div className="container" style={{ padding: 40, textAlign: 'center' }}>Laster dashboard...</div></>;

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>Velkommen, {user?.fullName}</p>
          </div>
          <Link href="/listings/new"><button className="btn btn-primary">+ List aksjer</button></Link>
        </div>

        {user?.kycStatus !== 'VERIFIED' && (
          <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Du er ikke KYC-verifisert. Fullfør verifisering for å handle aksjer.</span>
            <span className={`badge badge-${user?.kycStatus?.toLowerCase()}`}>{user?.kycStatus}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {/* My Listings */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Mine listings</h2>
            {!data?.myListings?.length ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Ingen listings ennå</p>
            ) : (
              data.myListings.map(l => (
                <Link key={l.id} href={`/listings/${l.id}`} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{l.company?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{l.sharesForSale.toLocaleString('nb-NO')} aksjer</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${l.status?.toLowerCase()}`}>{l.status}</span>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{l._count?.bids || 0} bud</div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* My Bids */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Mine bud</h2>
            {!data?.myBids?.length ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Ingen bud ennå</p>
            ) : (
              data.myBids.map(b => (
                <Link key={b.id} href={`/listings/${b.listingId}`} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{b.listing?.company?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>NOK {Number(b.pricePerShare).toLocaleString('nb-NO')} x {b.sharesWanted}</div>
                    </div>
                    <span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* My Deal Rooms */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Mine Deal Rooms</h2>
            {!data?.myDealRooms?.length ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Ingen deal rooms ennå</p>
            ) : (
              data.myDealRooms.map(dr => (
                <Link key={dr.id} href={`/dealrooms/${dr.id}`} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{dr.listing?.company?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{dr.members?.length} deltakere</div>
                    </div>
                    <span className="badge badge-active">{dr.stage?.replace('_', ' ')}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
