'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { CallState, CallAction, getNextCallState, IceCandidateBuffer, getIceServers } from '@sectalk/realtime';
import { UserRole } from '@sectalk/shared-types';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
}

export default function CallingPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  // Call Session State
  const [callState, setCallState] = useState<CallState>('idle');
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC options
  const [iceServers, setIceServers] = useState<any[]>([]);
  const [isUsingTurn, setIsUsingTurn] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  // ICE Buffer Simulation
  const [isBufferingEnabled, setIsBufferingEnabled] = useState(false);
  const [iceBuffer, setIceBuffer] = useState<IceCandidateBuffer | null>(null);
  const [bufferedCandidatesList, setBufferedCandidatesList] = useState<string[]>([]);
  const [flushTriggered, setFlushTriggered] = useState(false);

  // Video streams canvas animation
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('sectalk_user');
    if (rawUser) {
      setCurrentUser(JSON.parse(rawUser));
    }

    // Load ICE configuration
    setIceServers(getIceServers(true));

    // Initialize ICE Buffer Helper
    const buffer = new IceCandidateBuffer((cand) => {
      addLog(`[ICE Fused/Sent]: ${cand.candidate?.slice(0, 35)}...`);
    });
    setIceBuffer(buffer);

    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const addLog = (msg: string) => {
    setSessionLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 20)]);
  };

  // State Machine Action Dispatcher
  const dispatchAction = (action: CallAction) => {
    setCallState(prev => {
      const next = getNextCallState(prev, action);
      if (next !== prev) {
        addLog(`Transition: ${prev.toUpperCase()} ➡️ ${next.toUpperCase()} (Action: ${action})`);
      }
      return next;
    });
  };

  // Manage call timer
  useEffect(() => {
    if (callState === 'active') {
      durationTimerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      drawVideoStreams();
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (callState === 'idle' || callState === 'ended') {
        setDuration(0);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [callState]);

  // Simulated WebRTC Signalling Handshake
  const startOutgoingCall = () => {
    if (currentUser?.tier === 'free' && isUsingTurn) {
      addLog('❌ Policy Hold: TURN fallbacks are restricted for Free tiers. Upgrade organization plan.');
      return;
    }

    dispatchAction('start_dial');
    addLog('Creating Local SDP Offer...');
    
    // Simulate candidate generation
    setTimeout(() => {
      dispatchAction('receive_ring');
      simulateIceCandidateDiscovery();
    }, 1200);

    setTimeout(() => {
      addLog('Remote Peer accepted call. Setting Remote SDP Answer...');
      dispatchAction('accept_call');
      
      // Connection negotiation delay
      setTimeout(() => {
        dispatchAction('signal_connected');
        addLog('WebRTC Peer Connection successfully negotiated.');
      }, 1000);
    }, 3000);
  };

  const simulateIceCandidateDiscovery = () => {
    const candidates = [
      'candidate:84216304 1 udp 16777215 192.168.1.50 54321 typ host',
      'candidate:19421882 1 tcp 16777215 192.168.1.50 9 typ host',
      'candidate:23812891 1 udp 41628192 103.88.22.11 3478 typ srflx raddr 192.168.1.50 rport 54321',
      'candidate:10928138 1 udp 21307064 203.0.113.88 3478 typ relay raddr 103.88.22.11 rport 3478'
    ];

    candidates.forEach((candStr, idx) => {
      setTimeout(() => {
        const item = { candidate: candStr, sdpMid: '0', sdpMLineIndex: 0 };
        if (isBufferingEnabled && iceBuffer) {
          iceBuffer.addCandidate(item);
          setBufferedCandidatesList(prev => [...prev, candStr]);
          addLog(`[ICE Buffered]: Queue count: ${iceBuffer.getBufferedCount()}`);
        } else {
          addLog(`[ICE Direct]: Applied ${candStr.slice(0, 30)}...`);
        }
      }, 1000 * (idx + 1));
    });
  };

  const flushBufferedCandidates = () => {
    if (iceBuffer) {
      iceBuffer.setRemoteDescriptionApplied(true);
      setBufferedCandidatesList([]);
      addLog('Manually flushed ICE Candidate buffers. SDP Applied.');
    }
  };

  const triggerNetworkDrop = () => {
    if (callState !== 'active') return;
    dispatchAction('trigger_reconnect');
    addLog('⚠️ Connection drop detected. Restarting ICE handshake...');
    
    // Simulate auto-reconnect recovery
    setTimeout(() => {
      addLog('ICE Restart successful. Peer state reconciled.');
      dispatchAction('signal_connected');
    }, 2500);
  };

  const triggerTurnForce = () => {
    setIsUsingTurn(true);
    addLog('🛡️ Forcing WebRTC media relay path through TURN servers (relay candidate prioritization).');
  };

  const endActiveCall = () => {
    dispatchAction('end_call');
    if (iceBuffer) iceBuffer.clear();
    setBufferedCandidatesList([]);
    addLog('Call ended by host.');
  };

  // Draw simulated dynamic static noise / visuals onto canvases
  const drawVideoStreams = () => {
    if (!localCanvasRef.current || !remoteCanvasRef.current) return;
    const lCtx = localCanvasRef.current.getContext('2d');
    const rCtx = remoteCanvasRef.current.getContext('2d');
    if (!lCtx || !rCtx) return;

    const w = 320;
    const h = 240;
    
    // Local camera stream simulator (Color noise / pulse)
    if (!camOff) {
      lCtx.fillStyle = `hsl(${Date.now() / 40 % 360}, 50%, 15%)`;
      lCtx.fillRect(0, 0, w, h);
      lCtx.fillStyle = '#fff';
      lCtx.font = '14px sans-serif';
      lCtx.fillText('Camera Input (Local)', 20, 40);
      
      // Green tracking circle representing Face ID
      lCtx.strokeStyle = 'var(--color-success)';
      lCtx.lineWidth = 2;
      lCtx.beginPath();
      lCtx.arc(w/2, h/2, 40 + Math.sin(Date.now()/200)*5, 0, 2*Math.PI);
      lCtx.stroke();
    } else {
      lCtx.fillStyle = '#1e293b';
      lCtx.fillRect(0, 0, w, h);
      lCtx.fillStyle = '#94a3b8';
      lCtx.font = '14px sans-serif';
      lCtx.fillText('Camera Disabled', 100, 120);
    }

    // Remote client stream simulator (Static noise)
    if (callState === 'active') {
      const imgData = rCtx.createImageData(w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const noise = Math.random() * 255;
        // Blend remote image background
        imgData.data[i] = noise * 0.1 + 30;     // Red
        imgData.data[i+1] = noise * 0.1 + 30;   // Green
        imgData.data[i+2] = noise * 0.4 + 80;   // Blue (Tech hue)
        imgData.data[i+3] = 255;                // Alpha
      }
      rCtx.putImageData(imgData, 0, 0);
      rCtx.fillStyle = '#fff';
      rCtx.font = '14px sans-serif';
      rCtx.fillText('Remote Feed (AES-256 E2EE)', 20, 40);
    } else {
      rCtx.fillStyle = '#0f172a';
      rCtx.fillRect(0, 0, w, h);
      rCtx.fillStyle = '#475569';
      rCtx.font = '14px sans-serif';
      rCtx.fillText('Awaiting Peer Connection...', 80, 120);
    }

    animationRef.current = requestAnimationFrame(drawVideoStreams);
  };

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!currentUser) return null;

  return (
    <div className="dashboard-grid">
      <Sidebar />

      <div className="call-simulator-grid">
        {/* Main Video Interface */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>WebRTC Call Portal</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                IceServer Configuration: <span style={{ color: 'var(--accent-primary)' }}>{isUsingTurn ? 'STUN + TURN Relay' : 'STUN Direct Only'}</span>
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`status-badge ${callState}`}>State: {callState.toUpperCase()}</span>
              {callState === 'active' && (
                <span style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  ⏱️ {formatTimer(duration)}
                </span>
              )}
            </div>
          </div>

          {/* Canvas Video Layout */}
          <div style={{ display: 'flex', gap: '20px', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ overflow: 'hidden', width: '320px', height: '240px', position: 'relative' }}>
              <canvas ref={localCanvasRef} width={320} height={240} style={{ display: 'block' }} />
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '11px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                Local (You)
              </div>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden', width: '320px', height: '240px', position: 'relative' }}>
              <canvas ref={remoteCanvasRef} width={320} height={240} style={{ display: 'block' }} />
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '11px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                Remote Peer
              </div>
            </div>
          </div>

          {/* Action Trigger Pad */}
          <div className="call-controls">
            {callState === 'idle' || callState === 'ended' ? (
              <button onClick={startOutgoingCall} className="btn-primary" style={{ borderRadius: '24px', padding: '12px 30px' }}>
                📞 Dial Secure Call
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className="btn-call mute"
                  style={{ background: micMuted ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)' }}
                  title="Toggle Microphone"
                >
                  🎙️
                </button>
                <button
                  onClick={() => setCamOff(!camOff)}
                  className="btn-call video"
                  style={{ background: camOff ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)' }}
                  title="Toggle Video Camera"
                >
                  📹
                </button>
                <button onClick={endActiveCall} className="btn-call hangup" title="End Call">
                  🛑
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Console / Diagnostics Side Panel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            Diagnostics Console
          </h3>

          {/* Buffer Control Toggle */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={isBufferingEnabled}
                onChange={e => {
                  setIsBufferingEnabled(e.target.checked);
                  if (iceBuffer) iceBuffer.clear();
                  setBufferedCandidatesList([]);
                  addLog(e.target.checked ? 'ICE Candidate Buffering Enabled (Holds until manual SDP Apply).' : 'ICE Candidate Buffering Disabled (Direct candidate processing).');
                }}
              />
              Freeze ICE Candidates
            </label>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
              Simulates candidate arrival before remote session descriptions are ready.
            </p>
            {isBufferingEnabled && bufferedCandidatesList.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={flushBufferedCandidates}
                  className="btn-primary"
                  style={{ fontSize: '10px', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
                >
                  Flush {bufferedCandidatesList.length} Candidates ➡️
                </button>
              </div>
            )}
          </div>

          {/* Degrade Connections Trigger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={triggerNetworkDrop}
              className="btn-secondary"
              disabled={callState !== 'active'}
              style={{ fontSize: '12px', padding: '8px', justifyContent: 'center' }}
            >
              ⚡ Simulate Network Drop (ICE Restart)
            </button>
            
            <button
              onClick={triggerTurnForce}
              className="btn-secondary"
              disabled={isUsingTurn}
              style={{ fontSize: '12px', padding: '8px', justifyContent: 'center' }}
            >
              🔄 Force TURN Relay Fallback
            </button>
          </div>

          {/* Candidate list rendering */}
          {bufferedCandidatesList.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-warning)' }}>Buffered Candidates:</span>
              <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>
                {bufferedCandidatesList.map((c, i) => (
                  <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '2px 0' }}>{c.slice(0, 40)}...</div>
                ))}
              </div>
            </div>
          )}

          {/* Console Action Logs */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connection Logs:</span>
            <div style={{
              flexGrow: 1,
              background: '#07080a',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '11px',
              overflowY: 'auto',
              color: 'var(--text-secondary)',
              maxHeight: '200px'
            }}>
              {sessionLogs.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Idle. Press "Dial Call" to connect.</span>}
              {sessionLogs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: '4px', borderBottom: '1px dashed rgba(255,255,255,0.02)' }}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
