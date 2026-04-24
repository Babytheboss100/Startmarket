'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import api, { API_BASE } from '../../../lib/api';
import { setToken, setUser } from '../../../lib/auth';

const GOOGLE_ERROR_MESSAGES = {
  oauth_denied: 'Google-innlogging ble avbrutt.',
  token_exchange_failed: 'Kunne ikke fullføre Google-innlogging. Prøv igjen.',
  email_not_verified: 'Google-eposten din er ikke verifisert.',
  invalid_state: 'Økten utløp. Prøv igjen.',
  missing_params: 'Mangler parametere fra Google. Prøv igjen.',
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('google_error');
    if (err) setGoogleError(GOOGLE_ERROR_MESSAGES[err] || 'Google-innlogging feilet.');
  }, [searchParams]);

  const handleGoogle = () => {
    const params = new URLSearchParams({ tenant: 'breedz', mode: 'register' });
    window.location.href = `${API_BASE}/auth/google?${params.toString()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Noe gikk galt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Opprett konto</h1>
          <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 24 }}>Bli med på Norges markedsplass for unoterte aksjer</p>
          {googleError && <div className="alert alert-error">{googleError}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={handleGoogle}
            style={{ marginBottom: 16, gap: 10 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1A6.98 6.98 0 0 1 5.48 12c0-.73.13-1.44.35-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Registrer med Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--gray-400)', fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
            <span>eller</span>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Fullt navn</label>
              <input className="form-input" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">E-post</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <span className="form-hint">Valgfritt</span>
            </div>
            <div className="form-group">
              <label className="form-label">Passord</label>
              <input className="form-input" type="password" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <span className="form-hint">Minimum 8 tegn</span>
            </div>
            <button className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Oppretter konto...' : 'Registrer'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--gray-600)' }}>
            Har du allerede konto? <Link href="/auth/login">Logg inn</Link>
          </p>
        </div>
      </div>
    </>
  );
}
