'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { setToken, setUser } from '../../../lib/auth';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Fullfører innlogging...');

  useEffect(() => {
    const token = searchParams.get('token');
    const googleError = searchParams.get('google_error');
    const linked = searchParams.get('linked');
    const redirect = searchParams.get('redirect');

    if (googleError) {
      // Send brukeren tilbake til login med feilmeldingen
      router.replace(`/auth/login?google_error=${encodeURIComponent(googleError)}`);
      return;
    }

    if (!token) {
      router.replace('/auth/login?google_error=missing_params');
      return;
    }

    setToken(token);
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data);
        if (linked === '1') {
          setMessage('Google-kontoen din er koblet til din eksisterende konto.');
          setTimeout(() => router.replace(redirect || '/dashboard'), 1200);
        } else {
          router.replace(redirect || '/dashboard');
        }
      })
      .catch(() => {
        setMessage('Kunne ikke hente bruker. Prøv å logge inn på nytt.');
        setTimeout(() => router.replace('/auth/login?google_error=token_exchange_failed'), 1500);
      });
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--gray-50)', padding: 24,
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{ color: 'var(--gray-700)', fontSize: 15 }}>{message}</p>
      </div>
    </div>
  );
}
