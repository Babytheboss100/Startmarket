'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';
import { setToken, setUser } from '../../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Logg inn</h1>
          <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 24 }}>Velkommen tilbake til StartMarket</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-post</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Passord</label>
              <input className="form-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Logger inn...' : 'Logg inn'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--gray-600)' }}>
            Har du ikke konto? <Link href="/auth/register">Registrer deg</Link>
          </p>
        </div>
      </div>
    </>
  );
}
