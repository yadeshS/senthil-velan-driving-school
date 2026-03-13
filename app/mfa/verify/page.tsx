'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MFAVerifyPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find(f => f.status === 'verified');
      if (!verified) {
        router.replace('/mfa/setup');
        return;
      }
      setFactorId(verified.id);
      setLoading(false);
    });
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (error) throw error;
      router.push('/portal/staff');
    } catch (err: any) {
      setError(err.message || 'Invalid code. Try again.');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ fontSize: 28 }}>🔐</div>
          <h1>Two-Factor Verification</h1>
          <p>Open your authenticator app to get the code</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleVerify} className="login-form">
          <div className="form-group">
            <label>6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              style={{ fontSize: 28, textAlign: 'center', letterSpacing: 10, fontWeight: 700 }}
            />
          </div>
          <button type="submit" className="login-submit" disabled={verifying || code.length !== 6}>
            {verifying ? 'Verifying…' : 'Verify & Log In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Google Authenticator · Authy · any TOTP app
        </p>

        <a
          href="/login"
          className="login-back"
          onClick={async e => { e.preventDefault(); await supabase.auth.signOut(); router.push('/login'); }}
        >
          ← Back to login
        </a>
      </div>
    </div>
  );
}
