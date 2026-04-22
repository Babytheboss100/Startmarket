'use client';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { useTenant } from '../lib/TenantContext';

export default function Home() {
  const tenant = useTenant();
  const isBreedz = tenant.id === 'breedz';

  const stats = [
    { label: 'Under 1M', value: '5% per side' },
    { label: 'Over 1M', value: '3% per side' },
    { label: 'Datapunkter', value: tenant.insightsLabel },
    { label: 'Plattform', value: '100% Norsk' }
  ];

  const features = [
    { title: 'List aksjer', desc: 'Opprett en annonse med org.nr. Vi henter selskapsinformasjon automatisk fra Brønnøysundregisteret.' },
    { title: tenant.insightsFeatureTitle, desc: tenant.insightsFeatureDesc },
    { title: 'Motta bud', desc: 'Interesserte kjøpere legger inn bud. Du ser alle bud og velger det beste.' },
    { title: 'Deal Room', desc: 'Aksepter et bud og fullfør transaksjonen i et sikkert Deal Room med NDA, dokumenter og chat.' }
  ];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'var(--hero-bg)', color: 'var(--hero-text)', padding: 'clamp(40px, 7vw, 72px) 0 clamp(48px, 8vw, 80px)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 840 }}>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 52px)', fontWeight: 600, lineHeight: 1.08, marginBottom: 20, color: 'var(--hero-text)' }}>
            Kjøp og selg<br />
            <span style={{
              background: 'var(--hero-h1-gradient)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>unoterte aksjer</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.2vw, 18px)', color: 'var(--hero-subtle)', marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
            {tenant.brandName} — Norges markedsplass for handel av aksjer i unoterte selskaper. Strukturerte offentlige datapunkter, sikre Deal Rooms og transparent prisingsmodell.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/listings"><button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>Se markedsplassen</button></Link>
            <Link href="/auth/register">
              <button
                className="btn btn-outline"
                style={isBreedz
                  ? { padding: '14px 32px', fontSize: 16 }
                  : { padding: '14px 32px', fontSize: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
              >
                Opprett konto
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="card glow-border landing-stats-bar" style={{ padding: '28px 24px' }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 36px)', fontWeight: 600, textAlign: 'center', marginBottom: 40, color: 'var(--navy)' }}>Slik fungerer det</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="card glow-border">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 16 }}>{i + 1}</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 36px)', fontWeight: 600, textAlign: 'center', marginBottom: 40, color: 'var(--navy)' }}>Enkel og transparent prising</h2>
          <div className="landing-pricing-grid">
            <div className="card glow-border" style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Under NOK 1 000 000</div>
              <div style={{ fontSize: 56, fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>5%</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 8 }}>per side (kjøper + selger)</div>
            </div>
            <div className="card glow-border" style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Over NOK 1 000 000</div>
              <div style={{ fontSize: 56, fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>3%</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 8 }}>per side (kjøper + selger)</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: 'var(--cta-band-bg)', padding: '72px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4.5vw, 36px)', fontWeight: 600, color: 'var(--cta-band-text)', marginBottom: 16 }}>Klar til å handle unoterte aksjer?</h2>
          <p style={{ color: 'var(--cta-band-muted)', fontSize: 16, marginBottom: 32 }}>Opprett en gratis konto og kom i gang på minutter.</p>
          <Link href="/auth/register">
            <button className="btn" style={{ background: 'white', color: 'var(--royal)', padding: '14px 36px', fontSize: 16, fontWeight: 600 }}>Opprett konto</button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--footer-bg)', color: 'var(--footer-text)', padding: '40px 0', textAlign: 'center', fontSize: 14, borderTop: '1px solid var(--footer-border)' }}>
        <div className="container">
          <p>{tenant.footerBrand}</p>
          <p style={{ fontSize: 11, color: 'var(--footer-muted)', marginTop: 16, maxWidth: 780, margin: '16px auto 0', lineHeight: 1.55 }}>
            {tenant.disclaimer}
          </p>
        </div>
      </footer>
    </>
  );
}
