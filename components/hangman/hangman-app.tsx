'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGameClient, resetGameClient } from '@/lib/socket-client';
import { saveSession, loadSession, clearSession, type GameSession } from '@/lib/session';
import LandingScreen from './landing-screen';
import LobbyScreen from './lobby-screen';
import GameBoard from './game-board';
import EndScreen from './end-screen';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

export interface GameState {
  id: string;
  status: string;
  word?: string;
  maskedWord: string;
  hint1: string;
  hint2: string;
  hint3: string;
  score: number;
  penaltyHint: number;
  guessedLetters: string;
  incorrectGuesses: string;
  revealedHints: number;
  hostName: string;
  guesserName: string;
  hostConnected: boolean;
  guesserConnected: boolean;
  winner: string;
  penaltyConsonant?: number | null;
  penaltyVowel?: number | null;
}

export default function HangmanApp() {
  const [screen, setScreen] = useState<'landing' | 'lobby' | 'game' | 'end'>('landing');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [role, setRole] = useState<'host' | 'guesser' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [connected, setConnected] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  // Attempt session reconnection on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const session = loadSession();
    if (session) {
      const client = getGameClient();
      client.apiCall('reconnect-game', {
        gameId: session.gameId,
        name: session.playerName,
        role: session.role,
      }).then((res: any) => {
        if (res?.success) {
          setRole(session.role);
          setPlayerName(session.playerName);
          setGameState(res.game);
          client.startPolling(session.gameId, session.role);
          const status = res.game?.status ?? '';
          if (status === 'Ended') setScreen('end');
          else if (status === 'Active') setScreen('game');
          else setScreen('lobby');
          setConnected(true);
          toast.success('Reconnected to game!');
        } else {
          clearSession();
        }
      }).catch(() => {
        clearSession();
      });
    }
  }, []);

  // Listen for game updates from polling
  useEffect(() => {
    const client = getGameClient();

    const onUpdate = (game: GameState) => {
      setGameState((prev: GameState | null) => {
        return { ...(prev ?? {}), ...(game ?? {}) } as GameState;
      });
    };
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    client.on('game-updated', onUpdate);
    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);

    return () => {
      client.off('game-updated', onUpdate);
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
    };
  }, []);

  // Watch game state for screen transitions
  useEffect(() => {
    if (!gameState) return;
    if (gameState.status === 'Ended' && screen !== 'end') {
      setScreen('end');
    } else if (gameState.status === 'Active' && screen === 'lobby') {
      setScreen('game');
    }
  }, [gameState?.status, screen]);

  const handleCreateGame = useCallback(async (name: string) => {
    const client = getGameClient();
    const res = await client.apiCall('create-game', { hostName: name });
    if (res?.success) {
      setRole('host');
      setPlayerName(name);
      setGameState(res.game);
      saveSession({ gameId: res.gameId, playerName: name, role: 'host' });
      client.startPolling(res.gameId, 'host');
      setConnected(true);
      setScreen('lobby');
      toast.success('Game created!');
    } else {
      toast.error(res?.error ?? 'Failed to create game');
    }
  }, []);

  const handleJoinGame = useCallback(async (gameId: string, name: string) => {
    const client = getGameClient();
    const res = await client.apiCall('join-game', { gameId, guesserName: name });
    if (res?.success) {
      setRole('guesser');
      setPlayerName(name);
      setGameState(res.game);
      saveSession({ gameId, playerName: name, role: 'guesser' });
      client.startPolling(gameId, 'guesser');
      setConnected(true);
      const status = res.game?.status ?? '';
      if (status === 'Active') setScreen('game');
      else if (status === 'Ended') setScreen('end');
      else setScreen('lobby');
      toast.success('Joined game!');
    } else {
      toast.error(res?.error ?? 'Failed to join game');
    }
  }, []);

  const handleConfigureGame = useCallback(async (config: {
    word: string; hint1: string; hint2: string; hint3: string;
    penaltyConsonant?: number; penaltyVowel?: number; penaltyHint?: number;
  }) => {
    if (!gameState) return;
    const client = getGameClient();
    const res = await client.apiCall('configure-game', { gameId: gameState.id, ...config });
    if (res?.success) {
      setGameState(res.game);
      toast.success('Game configured!');
    } else {
      toast.error(res?.error ?? 'Failed to configure');
    }
  }, [gameState?.id]);

  const handleStartGame = useCallback(async () => {
    if (!gameState) return;
    const client = getGameClient();
    const res = await client.apiCall('start-game', { gameId: gameState.id });
    if (res?.success) {
      setGameState(res.game);
      setScreen('game');
    } else {
      toast.error(res?.error ?? 'Cannot start game');
    }
  }, [gameState?.id]);

  const handleGuessLetter = useCallback(async (letter: string) => {
    if (!gameState) return;
    const client = getGameClient();
    const res = await client.apiCall('guess-letter', { gameId: gameState.id, letter });
    if (res?.success) {
      const r = res.result;
      if (res.game) setGameState((prev: GameState | null) => ({ ...(prev ?? {}), ...(res.game ?? {}) } as GameState));
      if (r?.correct) {
        showFeedback(`\u2713 "${r?.letter ?? letter}" is correct!`);
      } else if ((r?.penalty ?? 0) > 0) {
        showFeedback(`\u2717 "${r?.letter ?? letter}" is wrong! -${r?.penalty?.toFixed?.(1) ?? '0'} pts`);
      }
    } else {
      toast.error(res?.error ?? 'Failed');
    }
  }, [gameState?.id, showFeedback]);

  const handleGuessWord = useCallback(async (word: string) => {
    if (!gameState) return;
    const client = getGameClient();
    const res = await client.apiCall('guess-word', { gameId: gameState.id, word });
    if (res?.success) {
      const r = res.result;
      if (res.game) setGameState((prev: GameState | null) => ({ ...(prev ?? {}), ...(res.game ?? {}) } as GameState));
      if (r?.correct) {
        showFeedback('\ud83c\udf89 Correct! You guessed the word!');
      } else {
        showFeedback(`\u2717 Wrong guess! -${r?.penalty ?? 25} pts`);
      }
    } else {
      toast.error(res?.error ?? 'Failed');
    }
  }, [gameState?.id, showFeedback]);

  const handleRequestHint = useCallback(async () => {
    if (!gameState) return;
    const client = getGameClient();
    const res = await client.apiCall('request-hint', { gameId: gameState.id });
    if (res?.success) {
      if (res.game) setGameState((prev: GameState | null) => ({ ...(prev ?? {}), ...(res.game ?? {}) } as GameState));
      toast.info(`Hint ${res.hintNumber ?? ''}: ${res.hint ?? ''} (-${res.penalty ?? 15} pts)`);
    } else {
      toast.error(res?.error ?? 'No more hints');
    }
  }, [gameState?.id]);

  const handleReplay = useCallback(async () => {
    if (!gameState) return;
    const client = getGameClient();
    const res = await client.apiCall('replay-game', { gameId: gameState.id });
    if (res?.success) {
      setGameState(res.game);
      saveSession({ gameId: res.newGameId, playerName, role: role ?? 'host' });
      client.startPolling(res.newGameId, role ?? 'host');
      setScreen('lobby');
      toast.success('New game created!');
    } else {
      toast.error(res?.error ?? 'Failed');
    }
  }, [gameState?.id, playerName, role]);

  const handleBackToHome = useCallback(() => {
    resetGameClient();
    clearSession();
    setGameState(null);
    setRole(null);
    setPlayerName('');
    setConnected(false);
    setScreen('landing');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Connection indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          connected
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg bg-card border border-border text-sm font-medium"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {screen === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingScreen
                onCreateGame={handleCreateGame}
                onJoinGame={handleJoinGame}
              />
            </motion.div>
          )}
          {screen === 'lobby' && gameState && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LobbyScreen
                game={gameState}
                role={role}
                onConfigure={handleConfigureGame}
                onStartGame={handleStartGame}
                onBack={handleBackToHome}
              />
            </motion.div>
          )}
          {screen === 'game' && gameState && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameBoard
                game={gameState}
                role={role}
                onGuessLetter={handleGuessLetter}
                onGuessWord={handleGuessWord}
                onRequestHint={handleRequestHint}
              />
            </motion.div>
          )}
          {screen === 'end' && gameState && (
            <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EndScreen
                game={gameState}
                role={role}
                playerName={playerName}
                onReplay={handleReplay}
                onHome={handleBackToHome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
