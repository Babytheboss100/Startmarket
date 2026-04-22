'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isLoggedIn, getUser, logout } from '../lib/auth';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setLoggedIn(isLoggedIn()); setUser(getUser()); }, []);

  const closeMenu = () => setMenuOpen(false);

  const navLinks = loggedIn ? (
    <>
      <Link href="/listings" onClick={closeMenu} style={{ color: 'var(--navy)', fontSize: 14, fontWeight: 500 }}>Markedsplass</Link>
      <Link href="/dashboard" onClick={closeMenu} style={{ color: 'var(--navy)', fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
      <Link href="/listings/new" onClick={closeMenu}><button className="btn btn-primary btn-sm">+ List aksjer</button></Link>
      <button className="btn btn-outline btn-sm" onClick={() => { closeMenu(); logout(); }}>Logg ut</button>
    </>
  ) : (
    <>
      <Link href="/listings" onClick={closeMenu} style={{ color: 'var(--navy)', fontSize: 14, fontWeight: 500 }}>Markedsplass</Link>
      <Link href="/auth/login" onClick={closeMenu}><button className="btn btn-outline btn-sm">Logg inn</button></Link>
      <Link href="/auth/register" onClick={closeMenu}><button className="btn btn-primary btn-sm">Registrer</button></Link>
    </>
  );

  return (
    <nav style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(44,79,163,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 72, gap: 16, position: 'relative' }}>
        <Link href="/" aria-label="BREEDZ Marketplace home" onClick={closeMenu} style={{ display: 'inline-flex', alignItems: 'center' }}>
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

        <div className="nav-desktop">{navLinks}</div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Lukk meny' : 'Åpne meny'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span aria-hidden>{menuOpen ? '✕' : '☰'}</span>
        </button>

        <div className={`nav-drawer${menuOpen ? ' open' : ''}`}>{navLinks}</div>
      </div>
    </nav>
  );
}
