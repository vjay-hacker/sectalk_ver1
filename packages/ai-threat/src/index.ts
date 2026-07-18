import { ThreatEvent, ThreatStatus } from '@sectalk/shared-types';

export interface ThreatAnalysisResult {
  riskScore: number; // 0 to 100
  threatLevel: 'clean' | 'suspicious' | 'malicious';
  findings: string[];
}

// 1. Message Risk Scoring
export function analyzeMessageContent(content: string): ThreatAnalysisResult {
  const findings: string[] = [];
  let score = 0;

  // Simple keyword detection for scam, credentials, leak
  const phishingKeywords = [
    'password update', 'verify your account', 'reset credentials', 
    'login immediately', 'urgent transfer', 'cryptocurrency double',
    'bank credentials', 'ssn update', 'click here to claim'
  ];

  const matchedKeywords = phishingKeywords.filter(k => 
    content.toLowerCase().includes(k)
  );

  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * 25;
    findings.push(`Phishing/Scam keywords detected: ${matchedKeywords.join(', ')}`);
  }

  // Detect suspicious links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];

  for (const url of urls) {
    // Flag known malicious mock TLDs or domains
    if (url.includes('free-gift') || url.includes('login-security-update') || url.includes('.xyz') || url.includes('bit.ly/fake')) {
      score += 40;
      findings.push(`Suspicious URL detected: ${url}`);
    } else {
      score += 5; // general link baseline risk
    }
  }

  // Cap the score at 100
  score = Math.min(100, score);
  
  let threatLevel: 'clean' | 'suspicious' | 'malicious' = 'clean';
  if (score >= 60) {
    threatLevel = 'malicious';
  } else if (score >= 25) {
    threatLevel = 'suspicious';
  }

  return { riskScore: score, threatLevel, findings };
}

// 2. File Threat Inspection
export function inspectFileAttachment(
  fileName: string, 
  fileSize: number, 
  mimeType: string
): { threatStatus: ThreatStatus; threatScore: number; reason?: string } {
  // Flag executables or script scripts
  const dangerousExtensions = ['.exe', '.bat', '.sh', '.scr', '.vbs', '.dmg'];
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  
  if (dangerousExtensions.includes(ext)) {
    return {
      threatStatus: 'malicious',
      threatScore: 95,
      reason: `Executable/Script extension (${ext}) is prohibited by security policy.`
    };
  }

  // Oversized binary files
  if (fileSize > 100 * 1024 * 1024) { // 100 MB
    return {
      threatStatus: 'flagged',
      threatScore: 50,
      reason: 'File size exceeds standard audit limit (100MB). Held for administrative review.'
    };
  }

  return {
    threatStatus: 'clean',
    threatScore: 5
  };
}

// 3. AI Safety Summaries (Redacting SSNs, API Keys, credit cards)
export function redactSensitiveContent(text: string): string {
  let redacted = text;

  // SSN pattern: XXX-XX-XXXX
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  redacted = redacted.replace(ssnRegex, '[REDACTED SSN]');

  // Credit Card pattern (simple 16 digit check)
  const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  redacted = redacted.replace(ccRegex, '[REDACTED CARD]');

  // Common API Key pattern (e.g. sk_live_..., gpt_...)
  const apiKeyRegex = /\b(sk_live_[a-zA-Z0-9]{24,48}|AIzaSy[a-zA-Z0-9-_]{33})\b/g;
  redacted = redacted.replace(apiKeyRegex, '[REDACTED API KEY]');

  return redacted;
}

// 4. Policy enforcement helper (policy bounds AI decisions)
export function checkAiDecisionAgainstPolicy(
  aiRiskScore: number, 
  allowOverride: boolean
): { allowMessage: boolean; requiresEscalation: boolean } {
  if (aiRiskScore >= 80) {
    // Critical risk: Block message, no direct bypass unless escalated
    return {
      allowMessage: false,
      requiresEscalation: true
    };
  }
  
  if (aiRiskScore >= 40) {
    // Suspicious risk: Allow with warning, require moderation review
    return {
      allowMessage: true,
      requiresEscalation: true
    };
  }

  return {
    allowMessage: true,
    requiresEscalation: false
  };
}
