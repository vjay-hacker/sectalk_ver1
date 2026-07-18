'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MockProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'soc_analyst';
  orgId: string;
  orgName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  avatar: string;
}

const MOCK_PROFILES: MockProfile[] = [
  {
    id: 'usr_alice',
    name: 'Alice Vance',
    email: 'alice@securecorp.com',
    role: 'owner',
    orgId: 'org_securecorp',
    orgName: 'SecureCorp Enterprise',
    tier: 'enterprise',
    avatar: 'AV'
  },
  {
    id: 'usr_bob',
    name: 'Bob Smith',
    email: 'bob@securecorp.com',
    role: 'member',
    orgId: 'org_securecorp',
    orgName: 'SecureCorp Enterprise',
    tier: 'enterprise',
    avatar: 'BS'
  },
  {
    id: 'usr_carol',
    name: 'Carol analyst',
    email: 'carol@cyberdyne.org',
    role: 'soc_analyst',
    orgId: 'org_cyberdyne',
    orgName: 'Cyberdyne Systems',
    tier: 'pro',
    avatar: 'CA'
  },
  {
    id: 'usr_david',
    name: 'David free',
    email: 'david@freeco.net',
    role: 'member',
    orgId: 'org_freeco',
    orgName: 'FreeCo LLC',
    tier: 'free',
    avatar: 'DF'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string>('usr_alice');
  const [mfaCode, setMfaCode] = useState<string>('');
  const [usePasskey, setUsePasskey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const profile = MOCK_PROFILES.find(p => p.id === selectedUser);
    if (!profile) return;

    // Simulate MFA validation
    setTimeout(() => {
      // Store session state in localStorage for sandbox simplicity
      localStorage.setItem('sectalk_user', JSON.stringify(profile));
      localStorage.setItem('sectalk_session_risk', JSON.stringify({
        newDevice: false,
        unusualIP: false,
        mfaCompleted: !!mfaCode || usePasskey,
        failedAttempts: 0
      }));
      setIsLoading(false);
      router.push('/rooms');
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            background: 'var(--accent-primary)',
            borderRadius: '10px',
            marginBottom: '16px'
          }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>Authenticate Sandbox</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Select a tenant and role to explore multi-tenant boundaries.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Tenant Identity</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MOCK_PROFILES.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedUser(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedUser === p.id ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: selectedUser === p.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-deep)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'var(--accent-primary)'
                    }}>
                      {p.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {p.role}
                    </span>
                    <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '2px' }}>{p.orgName} ({p.tier})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {usePasskey ? 'Passkey Verification' : 'Multi-Factor Code'}
              </label>
              <button
                type="button"
                onClick={() => setUsePasskey(!usePasskey)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Use {usePasskey ? 'MFA Token' : 'Passkey (FIDO2)'}
              </button>
            </div>

            {usePasskey ? (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                🔑 Hardware Security Key or Fingerprint will verify identity.
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter 6-digit MFA (e.g. 123456)"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                maxLength={6}
                style={{
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-light)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontSize: '14px',
                  textAlign: 'center',
                  letterSpacing: '2px'
                }}
              />
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
          >
            {isLoading ? 'Establishing secure session...' : 'Authorize Sandbox Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
