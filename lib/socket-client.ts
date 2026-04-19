'use client';

// REST-based game client that uses polling instead of WebSockets
// This works in both development and serverless production environments

export type GameEventCallback = (data: any) => void;

class GameClient {
  private gameId: string | null = null;
  private role: string | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, GameEventCallback[]> = new Map();
  private lastGameHash: string = '';
  private _connected: boolean = false;

  get connected(): boolean {
    return this._connected;
  }

  on(event: string, callback: GameEventCallback): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(callback);
    this.listeners.set(event, existing);
  }

  off(event: string, callback?: GameEventCallback): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const existing = this.listeners.get(event) ?? [];
      this.listeners.set(event, existing.filter((cb: GameEventCallback) => cb !== callback));
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.forEach((cb: GameEventCallback) => {
      try { cb(data); } catch (e) { console.error('Event callback error:', e); }
    });
  }

  async apiCall(action: string, data: any = {}): Promise<any> {
    try {
      const res = await fetch('/api/socketio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      console.error('API call error:', err);
      return { success: false, error: err?.message ?? 'Network error' };
    }
  }

  async pollGameState(): Promise<void> {
    if (!this.gameId) return;
    try {
      const res = await fetch(`/api/socketio?gameId=${encodeURIComponent(this.gameId)}&role=${encodeURIComponent(this.role ?? '')}`);
      const json = await res.json();
      if (json?.success && json?.game) {
        const hash = JSON.stringify(json.game);
        if (hash !== this.lastGameHash) {
          this.lastGameHash = hash;
          this.emit('game-updated', json.game);

          // Check for status transitions
          if (json.game?.status === 'Active') {
            this.emit('game-started', {});
          }
        }
        if (!this._connected) {
          this._connected = true;
          this.emit('connect', {});
        }
      }
    } catch {
      if (this._connected) {
        this._connected = false;
        this.emit('disconnect', {});
      }
    }
  }

  startPolling(gameId: string, role: string): void {
    this.gameId = gameId;
    this.role = role;
    this.stopPolling();
    this._connected = true;
    this.emit('connect', {});
    // Poll every 1.5 seconds
    this.pollInterval = setInterval(() => this.pollGameState(), 1500);
    // Immediate first poll
    this.pollGameState();
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  cleanup(): void {
    this.stopPolling();
    if (this.gameId && this.role) {
      // Best effort disconnect
      this.apiCall('disconnect', { gameId: this.gameId, role: this.role }).catch(() => {});
    }
    this.gameId = null;
    this.role = null;
    this.lastGameHash = '';
    this._connected = false;
    this.listeners.clear();
  }
}

let clientInstance: GameClient | null = null;

export function getGameClient(): GameClient {
  if (!clientInstance) {
    clientInstance = new GameClient();
  }
  return clientInstance;
}

export function resetGameClient(): void {
  if (clientInstance) {
    clientInstance.cleanup();
    clientInstance = null;
  }
}
