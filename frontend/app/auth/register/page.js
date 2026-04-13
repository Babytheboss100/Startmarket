'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';
import { setToken, setUser } from '../../../lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          {error && <div className="alert alert-error">{error}</div>}
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
