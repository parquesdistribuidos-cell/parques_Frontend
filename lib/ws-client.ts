const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001";

export type MsgHandler = (msg: { type: string; payload: Record<string, unknown> }) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private handlers: MsgHandler[] = [];
  private reconnectDelay = 2000;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => {
        this.send("AUTH", { token });
        resolve();
      };
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.handlers.forEach((h) => h(msg));
        } catch {}
      };
      this.ws.onerror = reject;
      this.ws.onclose = () => {
        this.handlers.forEach((h) => h({ type: "WS_CLOSED", payload: {} }));
      };
    });
  }

  send(type: string, payload: Record<string, unknown> = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  }

  onMessage(handler: MsgHandler) {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter((h) => h !== handler); };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new WSClient();
