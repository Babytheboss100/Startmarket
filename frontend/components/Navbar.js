'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isLoggedIn, getUser, logout } from '../lib/auth';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => { setLoggedIn(isLoggedIn()); setUser(getUser()); }, []);

  return (
    <nav style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(44,79,163,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
        <Link href="/" aria-label="BREEDZ Marketplace home" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Image
            src="/breedz-logo.png"
            alt=""
            width={456}
            height={200}
            priority
            style={{ height: 48, width: 'auto', filter: 'drop-shadow(0 4px 12px rgba(44, 79, 163, 0.2))' }}
          />
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/listings" style={{ color: 'var(--navy)', fontSize: 14, fontWeight: 500 }}>Markedsplass</Link>
        {loggedIn ? (
          <>
            <Link href="/dashboard" style={{ color: 'var(--navy)', fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
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
