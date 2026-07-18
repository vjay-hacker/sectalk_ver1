'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@sectalk/shared-types';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  avatar: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('sectalk_user');
    if (!rawUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(rawUser));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('sectalk_user');
    localStorage.removeItem('sectalk_session_risk');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="sidebar" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Checking session...</span>
      </div>
    );
  }

  // Determine authorized pages based on role
  const isSocAuthorized = ['owner', 'admin', 'soc_analyst'].includes(user.role);
  const isBillingAuthorized = ['owner'].includes(user.role);

  return (
    <div className="sidebar">
      <div>
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon" />
          <span className="logo-text">SecTalk</span>
        </div>

        {/* Navigation */}
        <div className="nav-links">
          <Link href="/rooms" className={`nav-item ${pathname === '/rooms' ? 'active' : ''}`}>
            <span>💬</span> Messaging Hub
          </Link>
          
          <Link href="/calls" className={`nav-item ${pathname === '/calls' ? 'active' : ''}`}>
            <span>📞</span> Calling & Meetings
          </Link>

          {isSocAuthorized ? (
            <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}>
              <span>🛡️</span> SOC Threat Center
            </Link>
          ) : (
            <div className="nav-item" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Requires SOC or Admin role">
              <span>🛡️</span> SOC (Restricted)
            </div>
          )}

          {isBillingAuthorized ? (
            <Link href="/billing" className={`nav-item ${pathname === '/billing' ? 'active' : ''}`}>
              <span>💳</span> SaaS Billing
            </Link>
          ) : (
            <div className="nav-item" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Requires Workspace Owner role">
              <span>💳</span> Billing (Restricted)
            </div>
          )}
        </div>
      </div>

      {/* User Session Info */}
      <div>
        <div className="user-profile" style={{ marginBottom: '12px' }}>
          <div className="avatar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            {user.avatar}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role} | {user.tier}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', padding: '8px', fontSize: '13px', justifyContent: 'center' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
