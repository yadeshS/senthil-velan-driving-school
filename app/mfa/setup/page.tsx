'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MFASetupPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.mfa.enroll({ factorType: 'totp' }).then(({ data, error }) => {
      if (error || !data) {
        setError('Failed to start 2FA setup. Please go back and log in again.');
        setLoading(false);
        return;
      }
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setLoading(false);
    });
  }, []);

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
      setError(err.message || 'Invalid code. Check the app and try again.');
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
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="login-logo">
          <div className="login-logo-icon" style={{ fontSize: 28 }}>🔐</div>
          <h1>Set Up Two-Factor Auth</h1>
          <p>One-time setup to secure your staff account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          {qrCode && (
            <img
              src={qrCode}
              alt="QR Code"
              style={{ width: 180, height: 180, border: '2px solid var(--border)', borderRadius: 12, padding: 8, background: 'white' }}
            />
          )}
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>Steps:</p>
          <ol style={{ paddingLeft: 18, color: 'var(--text)', lineHeight: 2 }}>
            <li>Install <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone</li>
            <li>Tap "Add account" → "Scan QR code"</li>
            <li>Scan the QR code above</li>
            <li>Enter the 6-digit code shown in the app below</li>
          </ol>
        </div>

        <details style={{ marginBottom: 16 }}>
          <summary style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>Can't scan? Enter key manually</summary>
          <code style={{ display: 'block', marginTop: 8, fontSize: 13, fontWeight: 700, letterSpacing: 2, wordBreak: 'break-all', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
            {secret}
          </code>
        </details>

        <form onSubmit={handleVerify} className="login-form">
          <div className="form-group">
            <label>Enter 6-digit code from the app</label>
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              style={{ fontSize: 26, textAlign: 'center', letterSpacing: 10, fontWeight: 700 }}
            />
          </div>
          <button type="submit" className="login-submit" disabled={verifying || code.length !== 6}>
            {verifying ? 'Activating…' : 'Activate & Continue →'}
          </button>
        </form>

        <a
          href="/login"
          className="login-back"
          onClick={async e => { e.preventDefault(); await supabase.auth.signOut(); router.push('/login'); }}
        >
          ← Cancel & log out
        </a>
      </div>
    </div>
  );
}
