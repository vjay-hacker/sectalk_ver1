'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { PLANS, calculateProratedSeatAddition, hasEntitlement } from '@sectalk/billing';
import { Subscription, Invoice, UserRole } from '@sectalk/shared-types';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
}

const DEFAULT_INVOICES: Record<string, Invoice[]> = {
  org_securecorp: [
    { id: 'inv_1001', subscriptionId: 'sub_securecorp', amount: 350.00, date: '2026-06-01', status: 'paid' },
    { id: 'inv_1002', subscriptionId: 'sub_securecorp', amount: 350.00, date: '2026-07-01', status: 'paid' }
  ],
  org_cyberdyne: [
    { id: 'inv_2001', subscriptionId: 'sub_cyberdyne', amount: 120.00, date: '2026-07-01', status: 'paid' }
  ],
  org_freeco: []
};

export default function BillingPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  // Subscription States
  const [activeTier, setActiveTier] = useState<Subscription['planTier']>('free');
  const [seats, setSeats] = useState(5);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Simulation controls
  const [addedSeatsCount, setAddedSeatsCount] = useState(5);
  const [prorationPreview, setProrationPreview] = useState<any>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('sectalk_user');
    if (rawUser) {
      const userObj = JSON.parse(rawUser) as UserSession;
      setCurrentUser(userObj);
      setActiveTier(userObj.tier);
      
      // Seed default seat allocations
      const defaultSeats = userObj.tier === 'enterprise' ? 10 : userObj.tier === 'pro' ? 8 : 4;
      setSeats(defaultSeats);
      
      setInvoices(DEFAULT_INVOICES[userObj.orgId] || []);
    }
  }, []);

  // Update proration preview when seat counts change
  useEffect(() => {
    if (!currentUser) return;
    
    // Simulate standard monthly renewal dates: July 1 to August 1
    const start = new Date('2026-07-01');
    const end = new Date('2026-08-01');
    // Middle of the cycle
    const current = new Date('2026-07-18'); 

    const math = calculateProratedSeatAddition(
      activeTier,
      seats,
      addedSeatsCount,
      start,
      end,
      current
    );
    setProrationPreview(math);
  }, [addedSeatsCount, seats, activeTier, currentUser]);

  const handlePurchaseSeats = () => {
    if (!prorationPreview) return;

    // Apply adjustments
    const finalSeats = seats + addedSeatsCount;
    setSeats(finalSeats);
    
    // Log new invoice
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      subscriptionId: `sub_${currentUser?.orgId}`,
      amount: prorationPreview.proratedDue,
      date: new Date().toISOString().slice(0,10),
      status: prorationPreview.proratedDue === 0 ? 'paid' : 'unpaid'
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setAddedSeatsCount(0);
    alert(`Successfully allocated ${addedSeatsCount} new license seats! Invoice issued.`);
  };

  const handleUpgradeTier = (tier: 'free' | 'pro' | 'team' | 'enterprise') => {
    setActiveTier(tier);
    
    // Update logged-in user in localStorage to trigger full permission changes
    if (currentUser) {
      const updatedUser = { ...currentUser, tier };
      localStorage.setItem('sectalk_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }
    
    alert(`Upgraded organization subscription tier to: ${PLANS[tier].name}`);
  };

  if (!currentUser) return null;

  // Enforce Owner Billing Bounds
  const isOwner = currentUser.role === 'owner';
  if (!isOwner) {
    return (
      <div className="dashboard-grid">
        <Sidebar />
        <div style={{ padding: '40px', textAlign: 'center', alignSelf: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You do not possess Owner privileges. Billing management is locked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <Sidebar />

      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Title */}
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>SaaS Subscription Management</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Configure seats and subscription tiers for: <strong style={{ color: '#fff' }}>{currentUser.orgName}</strong>
          </p>
        </div>

        {/* Current Entitlements details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Current Subscription Info</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  {PLANS[activeTier].name}
                </span>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ${PLANS[activeTier].pricePerSeat} / seat / month • {seats} Active Seats Assigned
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 700 }}>
                  ${seats * PLANS[activeTier].pricePerSeat}/mo
                </span>
              </div>
            </div>

            {/* Active Entitlements checkmarks */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Plan Entitlements</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div>{hasEntitlement(activeTier, 'webrtcGroupMeetings') ? '✅ Group Video Meetings' : '❌ Group Video Meetings'}</div>
                <div>{hasEntitlement(activeTier, 'threatDetection') ? '✅ AI Threat Scan' : '❌ AI Threat Scan'}</div>
                <div>{hasEntitlement(activeTier, 'customRetention') ? '✅ Custom Message Retention' : '❌ Custom Message Retention'}</div>
                <div>{hasEntitlement(activeTier, 'advancedSOC') ? '✅ Advanced SOC Tools' : '❌ Advanced SOC Tools'}</div>
              </div>
            </div>
          </div>

          {/* Seat Calculator & Proration tool */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>License Seat Adjustments</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px' }}>Add New User Seats:</span>
                <input
                  type="number"
                  min={1}
                  value={addedSeatsCount}
                  onChange={e => setAddedSeatsCount(Math.max(1, Number(e.target.value)))}
                  style={{
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-light)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    width: '80px',
                    textAlign: 'center'
                  }}
                />
              </div>

              {prorationPreview && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid var(--border-active)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Proration Math:</span>
                    <span>{prorationPreview.daysRemaining} days remaining in cycle</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                    <strong>Prorated Due Now:</strong>
                    <strong style={{ color: 'var(--accent-primary)' }}>${prorationPreview.proratedDue.toFixed(2)}</strong>
                  </div>
                </div>
              )}

              <button
                onClick={handlePurchaseSeats}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
              >
                Confirm License Allocation
              </button>
            </div>
          </div>
        </div>

        {/* Tier matrix details */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0' }}>Plan Tier Matrix</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.values(PLANS).map(p => (
              <div
                key={p.tier}
                style={{
                  background: activeTier === p.tier ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: activeTier === p.tier ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  padding: '16px',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{p.name}</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0' }}>
                    ${p.pricePerSeat}<span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/seat/mo</span>
                  </div>
                  <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Up to {p.maxSeats === 999999 ? 'Unlimited' : p.maxSeats} seats</li>
                    <li>Group Meetings: {p.entitlements.webrtcGroupMeetings ? '✅' : '❌'}</li>
                    <li>Threat Scans: {p.entitlements.threatDetection ? '✅' : '❌'}</li>
                    <li>SOC Center: {p.entitlements.advancedSOC ? '✅' : '❌'}</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => handleUpgradeTier(p.tier)}
                  className={activeTier === p.tier ? 'btn-primary' : 'btn-secondary'}
                  disabled={activeTier === p.tier}
                  style={{ fontSize: '11px', padding: '6px 12px', justifyContent: 'center' }}
                >
                  {activeTier === p.tier ? 'Current Subscription' : `Change to ${p.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Log List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Subscription Invoices</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {invoices.length === 0 && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No invoices issued yet.</span>
            )}
            
            {invoices.map(inv => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>Invoice ID: {inv.id}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Date: {inv.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>${inv.amount.toFixed(2)}</div>
                  <span style={{
                    fontSize: '10px',
                    color: inv.status === 'paid' ? 'var(--color-success)' : 'var(--color-warning)',
                    textTransform: 'uppercase'
                  }}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
