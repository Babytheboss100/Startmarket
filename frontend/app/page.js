'use client';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Navbar />
      {/* Hero */}
      <section style={{ background: '#0f172a', color: 'white', padding: '80px 0 60px' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 800 }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Kjøp og selg<br /><span style={{ color: 'var(--accent)' }}>unoterte aksjer</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            Norges markedsplass for handel av aksjer i unoterte selskaper. AI-drevet verdivurdering, sikre Deal Rooms og transparent prisingsmodell.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/listings"><button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>Se markedsplassen</button></Link>
            <Link href="/auth/register"><button className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 16, borderColor: '#475569', color: 'white' }}>Opprett konto</button></Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '24px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { label: 'Under 1M', value: '5% per side' },
            { label: 'Over 1M', value: '3% per side' },
            { label: 'Verdivurdering', value: 'AI StartScore' },
            { label: 'Plattform', value: '100% Norsk' }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>Slik fungerer det</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {[
              { title: 'List aksjer', desc: 'Opprett en annonse med org.nr. Vi henter selskapsinformasjon automatisk fra Brønnøysundregisteret.' },
              { title: 'AI-verdivurdering', desc: 'Få en AI-generert StartScore og indikativ verdi basert på bransje, omsetning og EBITDA.' },
              { title: 'Motta bud', desc: 'Interesserte kjøpere legger inn bud. Du ser alle bud og velger det beste.' },
              { title: 'Deal Room', desc: 'Aksepter et bud og fullfør transaksjonen i et sikkert Deal Room med NDA, dokumenter og chat.' }
            ].map((f, i) => (
              <div key={i} className="card">
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 16 }}>{i + 1}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: 'white', padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>Enkel og transparent prising</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 700, margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Under NOK 1 000 000</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)' }}>5%</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 8 }}>per side (kjøper + selger)</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Over NOK 1 000 000</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)' }}>3%</div>
              <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 8 }}>per side (kjøper + selger)</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--accent)', padding: '64px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 16 }}>Klar til å handle unoterte aksjer?</h2>
          <p style={{ color: '#bfdbfe', fontSize: 16, marginBottom: 32 }}>Opprett en gratis konto og kom i gang på minutter.</p>
          <Link href="/auth/register"><button className="btn" style={{ background: 'white', color: 'var(--accent)', padding: '14px 36px', fontSize: 16, fontWeight: 600 }}>Opprett konto</button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>
        <div className="container">
          <p>Help Holding AS &ndash; startmarket.no</p>
        </div>
      </footer>
    </>
  );
}
