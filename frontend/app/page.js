'use client';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Navbar />
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1A2B5C 0%, #243B7A 60%, #2C4FA3 100%)', color: 'white', padding: '96px 0 80px' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 840 }}>
          <h1 style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.05, marginBottom: 20, color: 'white' }}>
            Kjøp og selg<br />
            <span style={{
              background: 'linear-gradient(135deg, #C7B6FF 0%, #8FE8FF 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>unoterte aksjer</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.72)', marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
            BREEDZ Marketplace — Norges markedsplass for handel av aksjer i unoterte selskaper. AI-drevet verdivurdering, sikre Deal Rooms og transparent prisingsmodell.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/listings"><button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>Se markedsplassen</button></Link>
            <Link href="/auth/register"><button className="btn" style={{ padding: '14px 32px', fontSize: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>Opprett konto</button></Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="card glow-border" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center', padding: '28px 36px' }}>
            {[
              { label: 'Under 1M', value: '5% per side' },
              { label: 'Over 1M', value: '3% per side' },
              { label: 'Verdivurdering', value: 'AI BreedzScore' },
              { label: 'Plattform', value: '100% Norsk' }
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--royal)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 36, fontWeight: 600, textAlign: 'center', marginBottom: 40, color: 'var(--navy)' }}>Slik fungerer det</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {[
              { title: 'List aksjer', desc: 'Opprett en annonse med org.nr. Vi henter selskapsinformasjon automatisk fra Brønnøysundregisteret.' },
              { title: 'AI-verdivurdering', desc: 'Få en AI-generert BreedzScore og indikativ verdi basert på bransje, omsetning og EBITDA.' },
              { title: 'Motta bud', desc: 'Interesserte kjøpere legger inn bud. Du ser alle bud og velger det beste.' },
              { title: 'Deal Room', desc: 'Aksepter et bud og fullfør transaksjonen i et sikkert Deal Room med NDA, dokumenter og chat.' }
            ].map((f, i) => (
              <div key={i} className="card glow-border">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #C7B6FF, #8B7FD8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 16 }}>{i + 1}</div>
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
          <h2 style={{ fontSize: 36, fontWeight: 600, textAlign: 'center', marginBottom: 40, color: 'var(--navy)' }}>Enkel og transparent prising</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 700, margin: '0 auto' }}>
            <div className="card glow-border" style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Under NOK 1 000 000</div>
              <div style={{ fontSize: 56, fontWeight: 700, background: 'linear-gradient(135deg, #8B7FD8 0%, #2C4FA3 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>5%</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 8 }}>per side (kjøper + selger)</div>
            </div>
            <div className="card glow-border" style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Over NOK 1 000 000</div>
              <div style={{ fontSize: 56, fontWeight: 700, background: 'linear-gradient(135deg, #8B7FD8 0%, #2C4FA3 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>3%</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 8 }}>per side (kjøper + selger)</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #8B7FD8 0%, #2C4FA3 100%)', padding: '72px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: 'white', marginBottom: 16 }}>Klar til å handle unoterte aksjer?</h2>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 16, marginBottom: 32 }}>Opprett en gratis konto og kom i gang på minutter.</p>
          <Link href="/auth/register"><button className="btn" style={{ background: 'white', color: 'var(--royal)', padding: '14px 36px', fontSize: 16, fontWeight: 600 }}>Opprett konto</button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1A2B5C', color: 'rgba(255,255,255,0.72)', padding: '40px 0', textAlign: 'center', fontSize: 14 }}>
        <div className="container">
          <p>Help Holding AS &ndash; BREEDZ Marketplace</p>
        </div>
      </footer>
    </>
  );
}
