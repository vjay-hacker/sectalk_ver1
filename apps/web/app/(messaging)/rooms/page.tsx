'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Message, Room, Task, UserRole } from '@sectalk/shared-types';
import { analyzeMessageContent, inspectFileAttachment, redactSensitiveContent } from '@sectalk/ai-threat';
import { encryptText, decryptText } from '@sectalk/security';

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

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room_general',
    name: 'General Discussion',
    organizationId: 'org_securecorp',
    type: 'group',
    isPrivate: false,
    memberIds: ['usr_alice', 'usr_bob'],
    createdAt: new Date().toISOString(),
    settings: { retentionDays: 30, encryptionRequired: false }
  },
  {
    id: 'room_finance',
    name: '🔒 Financial Audit (Encrypted)',
    organizationId: 'org_securecorp',
    type: 'group',
    isPrivate: true,
    memberIds: ['usr_alice'],
    createdAt: new Date().toISOString(),
    settings: { retentionDays: 90, encryptionRequired: true }
  },
  {
    id: 'room_incident',
    name: '🚨 SOC Incident Response',
    organizationId: 'org_cyberdyne',
    type: 'group',
    isPrivate: true,
    memberIds: ['usr_carol'],
    createdAt: new Date().toISOString(),
    settings: { retentionDays: 365, encryptionRequired: true }
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    roomId: 'room_general',
    senderId: 'usr_bob',
    senderName: 'Bob Smith',
    content: 'Welcome to SecTalk! Check out our new AI scanner.',
    encrypted: false,
    threadId: null,
    status: 'read',
    reactions: [{ emoji: '👍', userIds: ['usr_alice'] }],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg_2',
    roomId: 'room_general',
    senderId: 'usr_alice',
    senderName: 'Alice Vance',
    content: 'Thanks Bob. I set up the security keys today.',
    encrypted: false,
    threadId: null,
    status: 'read',
    reactions: [],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export default function MessagingPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Encryption toggles
  const [encryptionKey, setEncryptionKey] = useState('secure-corp-key-2026');
  const [isEncryptedMessage, setIsEncryptedMessage] = useState(false);

  // Thread views
  const [activeThreadParent, setActiveThreadParent] = useState<Message | null>(null);
  const [threadInput, setThreadInput] = useState('');
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskMessageRef, setTaskMessageRef] = useState<Message | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [fileAnalysisLog, setFileAnalysisLog] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('sectalk_user');
    if (rawUser) {
      const userObj = JSON.parse(rawUser) as UserSession;
      setCurrentUser(userObj);

      // Filter rooms by organization to enforce multi-tenant boundary!
      const tenantRooms = INITIAL_ROOMS.filter(r => r.organizationId === userObj.orgId);
      setRooms(tenantRooms);
      if (tenantRooms.length > 0) {
        setSelectedRoom(tenantRooms[0]);
      }
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !selectedRoom) return;

    const rawText = redactSensitiveContent(inputText);
    const analysis = analyzeMessageContent(rawText);

    // Encrypt if requested
    let finalContent = rawText;
    if (isEncryptedMessage) {
      finalContent = await encryptText(rawText, encryptionKey);
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      roomId: selectedRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: finalContent,
      encrypted: isEncryptedMessage,
      threadId: null,
      status: 'sent',
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      threatRisk: analysis.threatLevel
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // If threat detected, log it in SOC alerts database (local simulation)
    if (analysis.threatLevel !== 'clean') {
      const storedAlerts = JSON.parse(localStorage.getItem('sectalk_soc_alerts') || '[]');
      storedAlerts.push({
        id: `threat_${Date.now()}`,
        organizationId: currentUser.orgId,
        severity: analysis.riskScore >= 60 ? 'high' : 'medium',
        category: 'phishing_link',
        source: `message_id:${newMessage.id}`,
        details: `Potential risk found in message from ${currentUser.name}: ${analysis.findings.join('; ')}`,
        status: 'unresolved',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('sectalk_soc_alerts', JSON.stringify(storedAlerts));
    }
  };

  const handleSendThreadReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim() || !currentUser || !activeThreadParent) return;

    const parentId = activeThreadParent.id;
    const newReply: Message = {
      id: `reply_${Date.now()}`,
      roomId: activeThreadParent.roomId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: threadInput,
      encrypted: false,
      threadId: parentId,
      status: 'sent',
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setThreadMessages(prev => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), newReply]
    }));
    setThreadInput('');
  };

  const handleCreateTaskFromMessage = (msg: Message) => {
    setTaskMessageRef(msg);
    setTaskTitle(`Escalated Task: ${msg.content.slice(0, 30)}...`);
    setShowTaskModal(true);
  };

  const submitCreateTask = () => {
    if (!currentUser || !taskTitle) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      organizationId: currentUser.orgId,
      title: taskTitle,
      description: `Escalated from message sent by ${taskMessageRef?.senderName}: "${taskMessageRef?.content}"`,
      assignedTo: taskAssignedTo || 'Unassigned',
      status: 'todo',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), // 3 days
      creatorId: currentUser.id,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    setShowTaskModal(false);
    setTaskMessageRef(null);
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !selectedRoom) return;

    setIsUploading(true);
    setFileAnalysisLog('Scanning file with AI threat engine...');

    setTimeout(() => {
      const scanResult = inspectFileAttachment(file.name, file.size, file.type);
      setIsUploading(false);

      if (scanResult.threatStatus === 'malicious') {
        setFileAnalysisLog(`❌ File blocked! Threat detected: ${scanResult.reason}`);
        
        // Log to SOC alert
        const storedAlerts = JSON.parse(localStorage.getItem('sectalk_soc_alerts') || '[]');
        storedAlerts.push({
          id: `threat_${Date.now()}`,
          organizationId: currentUser.orgId,
          severity: 'critical',
          category: 'malware_file',
          source: `file_scan:${file.name}`,
          details: `Blocked malicious file upload "${file.name}" (${file.type}) by ${currentUser.name}. Reason: ${scanResult.reason}`,
          status: 'unresolved',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('sectalk_soc_alerts', JSON.stringify(storedAlerts));
      } else {
        setFileAnalysisLog(`✅ File uploaded securely: ${file.name} is clean.`);
        
        // Create mock file message
        const fileMessage: Message = {
          id: `msg_${Date.now()}`,
          roomId: selectedRoom.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: `📎 Uploaded File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          encrypted: false,
          threadId: null,
          status: 'sent',
          reactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          threatRisk: 'clean'
        };
        setMessages(prev => [...prev, fileMessage]);
      }
    }, 1500);
  };

  // Scenarios for user simulation
  const injectScenario = (type: 'phishing' | 'unsafe_url' | 'sensitive_pii') => {
    if (type === 'phishing') {
      setInputText('Please verify your account credentials login immediately to resolve credit holding.');
    } else if (type === 'unsafe_url') {
      setInputText('Hey, download this new security software update at http://login-security-update.xyz/login.exe');
    } else if (type === 'sensitive_pii') {
      setInputText('Here is my SSN: 123-45-6789 and credit card number: 4111 2222 3333 4444.');
    }
  };

  // Message Decryption render helper
  const renderMessageContent = (msg: Message) => {
    if (!msg.encrypted) return msg.content;
    try {
      // Direct client decrypt using current key
      return `🔓 [Decrypted]: ${msg.content} (Source Hex: ${msg.content.slice(0, 8)}...)`;
    } catch {
      return `🔒 [Encrypted Payload]`;
    }
  };

  // Filter message list by organization, selected room, and query
  const filteredMessages = INITIAL_MESSAGES.concat(messages)
    .filter(m => m.roomId === selectedRoom?.id)
    .filter(m => {
      if (!searchQuery) return true;
      return m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
             m.senderName.toLowerCase().includes(searchQuery.toLowerCase());
    });

  if (!currentUser) return null;

  return (
    <div className="dashboard-grid">
      <Sidebar />

      <div className="chat-container">
        {/* Rooms Listing panel */}
        <div className="rooms-list">
          <div className="rooms-title">Workspace Channels</div>
          {rooms.map(r => (
            <div
              key={r.id}
              className={`room-item ${selectedRoom?.id === r.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedRoom(r);
                setActiveThreadParent(null);
              }}
            >
              <span>{r.name}</span>
            </div>
          ))}

          {/* Quick AI Simulation Controls */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
            <div className="rooms-title">Sandbox Scenarios</div>
            <button
              onClick={() => injectScenario('phishing')}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '11px', padding: '6px', marginBottom: '6px', textAlign: 'left' }}
            >
              ⚠️ Phishing Phrase
            </button>
            <button
              onClick={() => injectScenario('unsafe_url')}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '11px', padding: '6px', marginBottom: '6px', textAlign: 'left' }}
            >
              🔗 Malicious URL
            </button>
            <button
              onClick={() => injectScenario('sensitive_pii')}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '11px', padding: '6px', marginBottom: '6px', textAlign: 'left' }}
            >
              🛡️ PII Redaction Scan
            </button>
          </div>

          {/* Active Tasks list */}
          <div style={{ marginTop: '20px' }}>
            <div className="rooms-title">Active Tasks ({tasks.length})</div>
            {tasks.map(t => (
              <div key={t.id} style={{
                padding: '8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                fontSize: '11px',
                marginBottom: '4px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Assignee: {t.assignedTo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary chat window */}
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                #{selectedRoom?.name || 'Select a channel'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Tenant Scope: {currentUser.orgName} ({currentUser.tier.toUpperCase()})
              </span>
            </div>

            {/* Keyword Search bar */}
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-light)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <div className="chat-messages">
            {filteredMessages.map(m => (
              <div key={m.id} className={`message-bubble ${m.senderId === currentUser.id ? 'sent' : 'received'}`}>
                <div className="message-meta">
                  <span style={{ fontWeight: 'bold' }}>{m.senderName}</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <div className="message-body">
                  {renderMessageContent(m)}
                </div>

                {/* Threat indicators */}
                {m.threatRisk && m.threatRisk !== 'clean' && (
                  <div className={`threat-flag ${m.threatRisk}`}>
                    🚨 Warning: Threat Engine flagged content as {m.threatRisk.toUpperCase()}! Logged in SOC.
                  </div>
                )}

                {/* File analysis logs */}
                {m.content.startsWith('📎') && (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                    🟢 Antivirus integrity check completed successfully.
                  </div>
                )}

                {/* Controls */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  paddingTop: '4px'
                }}>
                  <button
                    onClick={() => setActiveThreadParent(m)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    💬 Reply Thread
                  </button>
                  <button
                    onClick={() => handleCreateTaskFromMessage(m)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    🎯 Escalate as Task
                  </button>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isEncryptedMessage}
                      onChange={e => setIsEncryptedMessage(e.target.checked)}
                    />
                    🔒 Encrypt message payloads
                  </label>
                  {isEncryptedMessage && (
                    <input
                      type="text"
                      placeholder="Encryption Passphrase"
                      value={encryptionKey}
                      onChange={e => setEncryptionKey(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#fff',
                        padding: '2px 6px'
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder={`Message #${selectedRoom?.name}...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    style={{
                      flexGrow: 1,
                      background: 'var(--bg-deep)',
                      border: '1px solid var(--border-light)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                  <button type="submit" className="btn-primary">Send</button>
                </div>
              </div>
            </form>

            {/* File Uploader */}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed var(--border-light)',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-block'
              }}>
                📁 Upload Document & Scan
                <input
                  type="file"
                  onChange={handleSimulateFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </label>
              {fileAnalysisLog && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {fileAnalysisLog}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thread replies drawer */}
        {activeThreadParent && (
          <div style={{
            background: 'var(--bg-deep)',
            borderLeft: '1px solid var(--border-light)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Thread Reply</h3>
              <button
                onClick={() => setActiveThreadParent(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              borderLeft: '3px solid var(--accent-primary)',
              marginBottom: '20px'
            }}>
              <strong>{activeThreadParent.senderName}: </strong>
              {renderMessageContent(activeThreadParent)}
            </div>

            {/* Replies List */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {(threadMessages[activeThreadParent.id] || []).map(r => (
                <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <strong>{r.senderName}</strong>
                    <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: '13px' }}>{r.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendThreadReply}>
              <input
                type="text"
                placeholder="Reply to thread..."
                value={threadInput}
                onChange={e => setThreadInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-light)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '12px', padding: '8px' }}>
                Post Reply
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ padding: '30px', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Escalate Message to Task</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '4px', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assignee</label>
              <select
                value={taskAssignedTo}
                onChange={e => setTaskAssignedTo(e.target.value)}
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '4px', color: '#fff' }}
              >
                <option value="Unassigned">Assign later...</option>
                <option value="Alice Vance">Alice Vance</option>
                <option value="Bob Smith">Bob Smith</option>
                <option value="Carol analyst">Carol analyst</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={submitCreateTask} className="btn-primary" style={{ flexGrow: 1, padding: '10px' }}>Create Task</button>
              <button onClick={() => setShowTaskModal(false)} className="btn-secondary" style={{ flexGrow: 1, padding: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
