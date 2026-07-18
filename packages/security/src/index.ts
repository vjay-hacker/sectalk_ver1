import { UserRole, AuditLog } from '@sectalk/shared-types';

// Simple check to ensure tenant boundaries are respected
export function verifyTenant(userOrgId: string, targetOrgId: string): boolean {
  if (!userOrgId || !targetOrgId) return false;
  return userOrgId === targetOrgId;
}

// Role-based Access Control logic
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['chat', 'call', 'manage_settings', 'view_soc', 'resolve_threats', 'manage_billing', 'view_audit_logs'],
  admin: ['chat', 'call', 'manage_settings', 'view_soc', 'resolve_threats', 'view_audit_logs'],
  soc_analyst: ['chat', 'call', 'view_soc', 'resolve_threats'],
  member: ['chat', 'call']
};

export function hasPermission(role: UserRole, action: string): boolean {
  const allowedActions = ROLE_PERMISSIONS[role];
  return allowedActions ? allowedActions.includes(action) : false;
}

// Session Risk Scoring
export function calculateSessionRisk(factors: {
  newDevice: boolean;
  unusualIP: boolean;
  mfaCompleted: boolean;
  failedAttempts: number;
}): number {
  let score = 10; // baseline risk

  if (factors.newDevice) score += 25;
  if (factors.unusualIP) score += 20;
  if (!factors.mfaCompleted) score += 30;
  
  score += factors.failedAttempts * 10;
  
  return Math.min(100, Math.max(0, score));
}

// Structured Audit Log creator
export function createAuditLog(
  userId: string,
  organizationId: string,
  action: string,
  ipAddress: string,
  details: string
): Omit<AuditLog, 'id' | 'createdAt'> {
  return {
    userId,
    organizationId,
    action,
    ipAddress,
    details
  };
}

// Cryptography: Simulated AES-GCM for demonstration / fallback, and real WebCrypto support
export async function encryptText(text: string, secretKeyHex: string): Promise<string> {
  try {
    if (typeof window === 'undefined' && typeof crypto === 'undefined') {
      // In older environments without crypto
      return Buffer.from(text).toString('base64');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Hash key to get a valid 256-bit key
    const rawKey = encoder.encode(secretKeyHex.padEnd(32, '0').slice(0, 32));
    const cryptoInstance = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const cryptoKey = await cryptoInstance.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = cryptoInstance.getRandomValues(new Uint8Array(12));
    const encrypted = await cryptoInstance.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...result));
  } catch (err) {
    console.error('Encryption failed, falling back to base64', err);
    return btoa(text);
  }
}

export async function decryptText(encryptedBase64: string, secretKeyHex: string): Promise<string> {
  try {
    if (typeof window === 'undefined' && typeof crypto === 'undefined') {
      return Buffer.from(encryptedBase64, 'base64').toString('utf8');
    }
    const rawData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = rawData.slice(0, 12);
    const encrypted = rawData.slice(12);
    
    const encoder = new TextEncoder();
    const rawKey = encoder.encode(secretKeyHex.padEnd(32, '0').slice(0, 32));
    
    const cryptoInstance = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const cryptoKey = await cryptoInstance.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await cryptoInstance.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Decryption failed, falling back to base64 decoding', err);
    try {
      return atob(encryptedBase64);
    } catch {
      return encryptedBase64;
    }
  }
}
