# SecTalk Features & Architecture

SecTalk is an enterprise-grade secure collaboration suite. It includes:

## 1. Secure Messaging & Channels
- **1:1 and Group Channels**: Instant chat with multi-tenant workspace boundaries.
- **Threaded Replies & Reactions**: Keep conversations contextual and interactive.
- **Delivery States**: Track queued, sent, delivered, read, and failed message states.
- **Task Integration**: Instantly escalate messages into trackable team tasks.

## 2. Robust WebRTC Calling
- **Deterministic Call State Machine**: Unified handling of calling states (idle, dialing, ringing, connecting, active, ended).
- **ICE Candidate Buffering**: Safely buffers local/remote ICE candidates if SDP descriptions are not yet established.
- **TURN Fallback & Reconnection**: Handles direct connection failures and manages state reconciliation.

## 3. Realtime presence & updates
- Simulated real-time server synchronizations via mock connection polling, with extensible WebSockets architecture.

## 4. AI-Powered Threat Center (SOC)
- **Message Risk Scoring**: Evaluates links and files for potential phishing or malicious intent.
- **Dynamic Policy Actions**: Automatically flags, hides, or redirects threat events based on admin constraints.

## 5. Billing & Subscription Dashboard
- Subscription tiers: Free, Pro, Team, and Enterprise.
- Dynamic billing calculators: Pro-rated seat changes and subscription adjustments.
