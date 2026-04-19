'use client';

export interface GameSession {
  gameId: string;
  playerName: string;
  role: 'host' | 'guesser';
}

const SESSION_KEY = 'hangman_session';

export function saveSession(session: GameSession): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch { /* noop */ }
}

export function loadSession(): GameSession | null {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch { /* noop */ }
  return null;
}

export function clearSession(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch { /* noop */ }
}
