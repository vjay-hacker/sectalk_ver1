'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThreatEvent, AuditLog, UserRole } from '@sectalk/shared-types';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
}

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud_1', userId: 'usr_alice', organizationId: 'org_securecorp', action: 'USER_LOGIN', ipAddress: '192.168.1.110', details: 'Successful login with hardware passkey validation.', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'aud_2', userId: 'usr_bob', organizationId: 'org_securecorp', action: 'PEER_CALL_START', ipAddress: '192.168.1.222', details: 'WebRTC outbound voice call initialized.', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'aud_3', userId: 'usr_alice', organizationId: 'org_securecorp', action: 'POLICY_UPDATE', ipAddress: '192.168.1.110', details: 'Toggled E2EE encryption mandatory policy to TRUE.', createdAt: new Date(Date.now() - 1800000).toISOString() }
];

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Policy States
  const [blockExecutables, setBlockExecutables] = useState(true);
  const [forceMfa, setForceMfa] = useState(true);
  const [retentionDays, setRetentionDays] = useState(90);

  useEffect(() => {
    const rawUser = localStorage.getItem('sectalk_user');
    if (rawUser) {
      const userObj = JSON.parse(rawUser) as UserSession;
      setCurrentUser(userObj);

      // Load threat events from localStorage or set default
      const storedThreats = localStorage.getItem('sectalk_soc_alerts');
      if (storedThreats) {
        setThreats(JSON.parse(storedThreats));
      } else {
        const initialThreats: ThreatEvent[] = [
          {
            id: 'thr_1',
            organizationId: userObj.orgId,
            severity: 'high',
            category: 'phishing_link',
            source: 'message_id:msg_99',
            details: 'High probability phishing link detected: click-here-free-gift.xyz/claim',
            status: 'unresolved',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        localStorage.setItem('sectalk_soc_alerts', JSON.stringify(initialThreats));
        setThreats(initialThreats);
      }

      setAuditLogs(DEFAULT_AUDIT_LOGS.filter(log => log.organizationId === userObj.orgId));
    }
  }, []);

  const updateThreatStatus = (id: string, newStatus: 'resolved' | 'false_positive') => {
    const updated = threats.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setThreats(updated);
    localStorage.setItem('sectalk_soc_alerts', JSON.stringify(updated));
    
    // Add audit log
    if (currentUser) {
      const newAudit: AuditLog = {
        id: `aud_${Date.now()}`,
        userId: currentUser.id,
        organizationId: currentUser.orgId,
        action: newStatus === 'resolved' ? 'THREAT_RESOLVED' : 'THREAT_OVERRIDDEN',
        ipAddress: '127.0.0.1',
        details: `Threat alert ID: ${id} set to status: ${newStatus} by ${currentUser.name}`,
        createdAt: new Date().toISOString()
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }
  };

  // Severity metrics calculator
  const getMetrics = () => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, resolved: 0 };
    threats.forEach(t => {
      if (t.status !== 'unresolved') {
        counts.resolved += 1;
      } else {
        counts[t.severity] += 1;
      }
    });
    return counts;
  };

  if (!currentUser) return null;

  // Enforce SOC Authorization
  const isSocAuthorized = ['owner', 'admin', 'soc_analyst'].includes(currentUser.role);
  if (!isSocAuthorized) {
    return (
      <div className="dashboard-grid">
        <Sidebar />
        <div style={{ padding: '40px', textAlign: 'center', alignSelf: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You do not possess the SOC security clearance to inspect threat details.</p>
        </div>
      </div>
    );
  }

  const metrics = getMetrics();

  return (
    <div className="dashboard-grid">
      <Sidebar />

      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Title */}
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Security Operations Center (SOC)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Threat hunting dashboard for tenant: <strong style={{ color: '#fff' }}>{currentUser.orgName}</strong> ({currentUser.tier.toUpperCase()})
          </p>
        </div>

        {/* Severity Metrics cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-danger)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Critical Threats</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>{metrics.critical}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-warning)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High & Medium</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>{metrics.high + metrics.medium}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Priority</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>{metrics.low}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-success)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolved Items</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>{metrics.resolved}</div>
          </div>
        </div>

        {/* Dynamic Threat Feeds & Settings layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          
          {/* Active Threat Queue */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Threat Incident Logs</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {threats.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  No threats detected. System is running cleanly.
                </div>
              )}
              
              {threats.map(t => (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: t.severity === 'critical' || t.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: t.severity === 'critical' || t.severity === 'high' ? 'var(--color-danger)' : 'var(--color-warning)',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {t.severity} • {t.category.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>{t.details}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Status: <strong style={{ color: t.status === 'unresolved' ? 'var(--color-warning)' : 'var(--color-success)' }}>{t.status.toUpperCase()}</strong>
                    </span>

                    {t.status === 'unresolved' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => updateThreatStatus(t.id, 'resolved')}
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Resolve & Quarantine
                        </button>
                        <button
                          onClick={() => updateThreatStatus(t.id, 'false_positive')}
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Mark False Positive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Org Policy Configurations */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Workspace Guardrails</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                Block Executables (.exe, .sh)
                <input
                  type="checkbox"
                  checked={blockExecutables}
                  onChange={e => setBlockExecutables(e.target.checked)}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                Enforce Mandatory MFA
                <input
                  type="checkbox"
                  checked={forceMfa}
                  onChange={e => setForceMfa(e.target.checked)}
                />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Message Retention Window</span>
                <select
                  value={retentionDays}
                  onChange={e => setRetentionDays(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-light)',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                >
                  <option value={30}>30 Days (Standard)</option>
                  <option value={90}>90 Days (Corporate)</option>
                  <option value={365}>365 Days (Compliance Hold)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Trail */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Security Audit Trail</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Timestamp</th>
                  <th style={{ padding: '10px' }}>User ID</th>
                  <th style={{ padding: '10px' }}>Action</th>
                  <th style={{ padding: '10px' }}>IP Address</th>
                  <th style={{ padding: '10px' }}>Transaction Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.userId}</td>
                    <td style={{ padding: '10px', color: 'var(--accent-primary)' }}>{log.action}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
