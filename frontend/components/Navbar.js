'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isLoggedIn, getUser, logout } from '../lib/auth';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => { setLoggedIn(isLoggedIn()); setUser(getUser()); }, []);

  return (
    <nav style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' }}>Start<span style={{ color: 'var(--accent)' }}>Market</span></Link>
        <div style={{ flex: 1 }} />
        <Link href="/listings" style={{ color: 'var(--gray-700)', fontSize: 14, fontWeight: 500 }}>Markedsplass</Link>
        {loggedIn ? (
          <>
            <Link href="/dashboard" style={{ color: 'var(--gray-700)', fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
            <Link href="/listings/new"><button className="btn btn-primary btn-sm">+ List aksjer</button></Link>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logg ut</button>
          </>
        ) : (
          <>
            <Link href="/auth/login"><button className="btn btn-outline btn-sm">Logg inn</button></Link>
            <Link href="/auth/register"><button className="btn btn-primary btn-sm">Registrer</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
