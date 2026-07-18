export type UserRole = 'owner' | 'admin' | 'member' | 'soc_analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  userId: string;
  trustedAt: string | null;
  userAgent: string;
}

export interface Session {
  id: string;
  userId: string;
  organizationId: string;
  riskScore: number; // 0 to 100
  createdAt: string;
  expiresAt: string;
}

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  encrypted: boolean;
  threadId: string | null;
  status: MessageStatus;
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
  threatRisk?: 'clean' | 'suspicious' | 'malicious';
}

export interface Thread {
  id: string;
  parentMessageId: string;
  replyCount: number;
  lastReplyAt: string;
}

export type RoomType = 'direct' | 'group' | 'channel';

export interface Room {
  id: string;
  name: string;
  organizationId: string;
  type: RoomType;
  isPrivate: boolean;
  memberIds: string[];
  createdAt: string;
  settings: {
    retentionDays: number;
    encryptionRequired: boolean;
  };
}

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connecting' | 'active' | 'ended';

export interface Call {
  id: string;
  hostId: string;
  participantId: string;
  status: CallStatus;
  duration: number; // in seconds
  createdAt: string;
  webrtcSessionId: string;
}

export interface Meeting {
  id: string;
  roomId: string;
  code: string;
  status: 'scheduled' | 'live' | 'ended';
  participantsCount: number;
  createdAt: string;
}

export type ThreatStatus = 'clean' | 'inspecting' | 'malicious' | 'flagged';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  threatStatus: ThreatStatus;
  threatScore?: number;
  downloadUrl: string;
  uploaderId: string;
  organizationId: string;
  createdAt: string;
}

export interface ThreatEvent {
  id: string;
  organizationId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'phishing_link' | 'malware_file' | 'policy_violation' | 'credential_leak';
  source: string; // e.g. "message_id:123"
  details: string;
  status: 'unresolved' | 'resolved' | 'false_positive';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  assignedTo: string | null;
  status: TaskStatus;
  dueDate: string | null;
  creatorId: string;
  createdAt: string;
}

export interface BillingPlan {
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  name: string;
  pricePerSeat: number;
  maxSeats: number;
  entitlements: {
    webrtcGroupMeetings: boolean;
    threatDetection: boolean;
    customRetention: boolean;
    advancedSOC: boolean;
  };
}

export interface Subscription {
  id: string;
  organizationId: string;
  planTier: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  seats: number;
  nextBillingDate: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  date: string;
  status: 'paid' | 'unpaid' | 'void';
}
