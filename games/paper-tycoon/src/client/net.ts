import type { ClientMessage, ServerMessage } from '../shared/protocol.js';

type Listener = (msg: ServerMessage) => void;

/** WebSocket wrapper with automatic reconnect and session rejoin. */
export class Net {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(s: 'connecting' | 'open' | 'closed') => void>();
  private queue: string[] = [];
  private backoff = 500;
  private closedByUser = false;
  session: string | null = null;
  status: 'connecting' | 'open' | 'closed' = 'closed';

  connect(): void {
    this.closedByUser = false;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.setStatus('connecting');
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    ws.addEventListener('open', () => {
      this.backoff = 500;
      this.setStatus('open');
      if (this.session) this.sendNow({ t: 'rejoin', session: this.session });
      for (const q of this.queue) ws.send(q);
      this.queue = [];
    });
    ws.addEventListener('message', (ev) => {
      let msg: ServerMessage;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.t === 'welcome') this.session = msg.session;
      if (msg.t === 'left') this.session = null;
      if (msg.t === 'error' && msg.fatal) this.session = null;
      for (const l of this.listeners) l(msg);
    });
    ws.addEventListener('close', () => {
      this.ws = null;
      this.setStatus('closed');
      if (this.closedByUser) return;
      setTimeout(() => this.connect(), this.backoff);
      this.backoff = Math.min(8000, this.backoff * 1.7);
    });
    ws.addEventListener('error', () => { /* close follows */ });
  }

  send(msg: ClientMessage): void {
    const data = JSON.stringify(msg);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(data);
    else this.queue.push(data);
  }

  private sendNow(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  on(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }
  onStatus(l: (s: 'connecting' | 'open' | 'closed') => void): () => void { this.statusListeners.add(l); return () => this.statusListeners.delete(l); }
  private setStatus(s: 'connecting' | 'open' | 'closed'): void { this.status = s; for (const l of this.statusListeners) l(s); }

  close(): void { this.closedByUser = true; this.ws?.close(); }
}
