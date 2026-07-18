export type CallState = 'idle' | 'dialing' | 'ringing' | 'connecting' | 'active' | 'reconnecting' | 'ended';

export type CallAction =
  | 'start_dial'
  | 'receive_ring'
  | 'accept_call'
  | 'signal_connecting'
  | 'signal_connected'
  | 'trigger_reconnect'
  | 'end_call';

// Deterministic state machine transitions
const STATE_TRANSITIONS: Record<CallState, Partial<Record<CallAction, CallState>>> = {
  idle: {
    start_dial: 'dialing',
    receive_ring: 'ringing',
    end_call: 'ended'
  },
  dialing: {
    receive_ring: 'ringing',
    accept_call: 'connecting',
    end_call: 'ended'
  },
  ringing: {
    accept_call: 'connecting',
    end_call: 'ended'
  },
  connecting: {
    signal_connected: 'active',
    end_call: 'ended'
  },
  active: {
    trigger_reconnect: 'reconnecting',
    end_call: 'ended'
  },
  reconnecting: {
    signal_connected: 'active',
    end_call: 'ended'
  },
  ended: {
    start_dial: 'dialing',
    receive_ring: 'ringing'
  }
};

export function getNextCallState(currentState: CallState, action: CallAction): CallState {
  const transitions = STATE_TRANSITIONS[currentState];
  if (!transitions || !transitions[action]) {
    console.warn(`Invalid transition: state "${currentState}" does not support action "${action}"`);
    return currentState;
  }
  return transitions[action]!;
}

// ICE Candidate Buffer to queue candidates until SDP is fully applied
export class IceCandidateBuffer {
  private bufferedCandidates: RTCIceCandidateInit[] = [];
  private isRemoteDescriptionSet = false;

  constructor(private onFlushCandidate: (candidate: RTCIceCandidateInit) => void) {}

  public setRemoteDescriptionApplied(applied: boolean) {
    this.isRemoteDescriptionSet = applied;
    if (applied) {
      this.flush();
    }
  }

  public addCandidate(candidate: RTCIceCandidateInit) {
    if (this.isRemoteDescriptionSet) {
      this.onFlushCandidate(candidate);
    } else {
      this.bufferedCandidates.push(candidate);
      console.log(`Buffered ICE candidate: ${candidate.candidate?.slice(0, 30)}... total: ${this.bufferedCandidates.length}`);
    }
  }

  public flush() {
    console.log(`Flushing ${this.bufferedCandidates.length} buffered ICE candidates`);
    while (this.bufferedCandidates.length > 0) {
      const candidate = this.bufferedCandidates.shift();
      if (candidate) {
        this.onFlushCandidate(candidate);
      }
    }
  }

  public clear() {
    this.bufferedCandidates = [];
    this.isRemoteDescriptionSet = false;
  }

  public getBufferedCount(): number {
    return this.bufferedCandidates.length;
  }
}

// TURN Fallback & ICE Server helper
export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export function getIceServers(includeTurnFallback = true): IceServerConfig[] {
  const servers: IceServerConfig[] = [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
    }
  ];

  if (includeTurnFallback) {
    // Standard mock TURN fallback servers for enterprise networks
    servers.push({
      urls: ['turn:turn.sectalk.net:3478?transport=udp', 'turn:turn.sectalk.net:3478?transport=tcp'],
      username: 'sectalk-client',
      credential: 'secure-session-key-fallback'
    });
  }

  return servers;
}
