import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Spheres */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: -1
      }} />

      {/* Header Info */}
      <div className="animate-slide-up" style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '50px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#818cf8',
          marginBottom: '24px'
        }}>
          🛡️ Enterprise-Grade Communication Shield
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: '1.15',
          margin: '0 0 20px 0',
          background: 'linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          Secure, AI-Enhanced Collaboration for Modern Teams
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto 40px auto'
        }}>
          SecTalk replaces scattered chats, risky links, and unreliable video calls with zero-trust isolation, deterministic WebRTC signaling, and real-time AI security scans.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: '15px' }}>
            Enter Sandbox Workspace
          </Link>
          <a href="#features" className="btn-secondary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: '15px' }}>
            View Security Architecture
          </a>
        </div>
      </div>

      {/* Grid of Key Features */}
      <div id="features" className="glass-panel" style={{
        maxWidth: '1000px',
        width: '100%',
        padding: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>💬</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '5px 0' }}>Zero-Trust Messages</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Multi-tenant boundary checks run on every message. Complete tenant isolation ensures zero cross-workspace visibility.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>📞</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '5px 0' }}>Resilient WebRTC</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Deterministic call states, pre-signal candidate buffering, automatic TURN fallbacks, and connection recovery rules.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>🤖</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '5px 0' }}>AI Threat Engine</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Scans links and files instantly, assigns risk scores, and flags phishing scams without violating tenant encryption guidelines.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>💼</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '5px 0' }}>SOC Security Center</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Security operation dash with real-time audit logs, threat resolution queues, organization level policy toggles, and compliance holds.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>💳</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '5px 0' }}>SaaS Billing</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Free, Pro, Team, and Enterprise models. Prorated pricing checks when adding user seats mid-cycle.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>🚀</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '5px 0' }}>Vercel Optimized</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Next.js App Router, edge middleware guards, serverless background support, and clean workspace packages links.
          </p>
        </div>
      </div>

      <footer style={{ marginTop: '60px', color: 'var(--text-muted)', fontSize: '12px' }}>
        &copy; {new Date().getFullYear()} SecTalk Technologies Inc. All rights reserved. Deployed on Vercel Edge.
      </footer>
    </div>
  );
}
