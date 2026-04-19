'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { GameState } from './hangman-app';
import { Lightbulb, Send, Trophy, XCircle, User, Eye, Keyboard } from 'lucide-react';

interface Props {
  game: GameState;
  role: 'host' | 'guesser' | null;
  onGuessLetter: (letter: string) => void;
  onGuessWord: (word: string) => void;
  onRequestHint: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function GameBoard({ game, role, onGuessLetter, onGuessWord, onRequestHint }: Props) {
  const [wordGuess, setWordGuess] = useState('');
  const isGuesser = role === 'guesser';
  const maskedWord = game?.maskedWord ?? '';
  const score = game?.score ?? 0;
  const revealedHints = game?.revealedHints ?? 0;
  const hints = [game?.hint1 ?? '', game?.hint2 ?? '', game?.hint3 ?? ''];

  const guessedSet = useMemo(() => {
    const letters = game?.guessedLetters ?? '';
    return new Set(letters?.split?.(',')?.filter?.(Boolean)?.map?.((l: string) => l?.toUpperCase?.() ?? '') ?? []);
  }, [game?.guessedLetters]);

  const incorrectArr = useMemo(() => {
    const letters = game?.incorrectGuesses ?? '';
    return letters?.split?.(',')?.filter?.(Boolean) ?? [];
  }, [game?.incorrectGuesses]);

  // Word display - split into words then characters
  const wordChars = useMemo(() => {
    return maskedWord?.split?.('')?.map?.((ch: string, i: number) => ({
      char: ch,
      isLetter: /[A-Za-z_]/.test(ch ?? ''),
      isRevealed: ch !== '_',
      index: i,
    })) ?? [];
  }, [maskedWord]);

  const handleWordGuess = () => {
    if (!wordGuess?.trim()) return;
    onGuessWord?.(wordGuess.trim());
    setWordGuess('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-3xl">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              <User className="w-3 h-3 mr-1" />
              {isGuesser ? game?.guesserName : game?.hostName}
            </Badge>
            <Badge variant="secondary">
              {isGuesser ? 'Guesser' : 'Spectating'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${game?.hostConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <span className="text-xs text-muted-foreground">{game?.hostName ?? 'Host'}</span>
            <div className={`w-2.5 h-2.5 rounded-full ${game?.guesserConnected ? 'bg-emerald-500' : 'bg-red-400'} ml-3`} />
            <span className="text-xs text-muted-foreground">{game?.guesserName ?? 'Guesser'}</span>
          </div>
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="font-medium">Score</span>
                </div>
                <span className="text-2xl font-bold font-mono text-primary">
                  {score?.toFixed?.(1) ?? '0.0'}
                </span>
              </div>
              <Progress value={score} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Word display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {wordChars?.map?.((ch: any, i: number) => {
                  if (ch?.char === ' ') {
                    return <div key={`space-${i}`} className="w-4" />;
                  }
                  if (!ch?.isLetter) {
                    return (
                      <div key={`punct-${i}`} className="text-xl font-bold text-muted-foreground">
                        {ch?.char ?? ''}
                      </div>
                    );
                  }
                  return (
                    <motion.div
                      key={`char-${i}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`w-10 h-12 md:w-12 md:h-14 flex items-center justify-center rounded-lg border-2 font-bold text-xl md:text-2xl font-mono
                        ${ch?.isRevealed
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/50 border-border text-transparent'
                        }`}
                    >
                      {ch?.isRevealed ? ch?.char?.toUpperCase?.() ?? '' : '_'}
                    </motion.div>
                  );
                }) ?? null}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Incorrect guesses */}
        {(incorrectArr?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Incorrect Guesses</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {incorrectArr?.map?.((letter: string, i: number) => (
                    <Badge key={`inc-${i}`} variant="destructive" className="font-mono text-sm">
                      {letter ?? ''}
                    </Badge>
                  )) ?? null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Hints */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Hints
                <span className="text-xs text-muted-foreground ml-auto">-{game?.penaltyHint ?? 15} pts each</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hints?.map?.((hint: string, i: number) => (
                <div key={`hint-${i}`} className={`flex items-center gap-3 p-3 rounded-lg ${
                  i < revealedHints ? 'bg-primary/5' : 'bg-muted/50'
                }`}>
                  <Badge variant={i < revealedHints ? 'default' : 'outline'} className="shrink-0">
                    {i + 1}
                  </Badge>
                  {i < revealedHints ? (
                    <p className="text-sm">{hint}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Hidden</p>
                  )}
                </div>
              )) ?? null}
              {isGuesser && revealedHints < 3 && (
                <Button variant="outline" size="sm" onClick={onRequestHint} className="w-full mt-2">
                  <Eye className="w-4 h-4 mr-2" /> Reveal Hint {revealedHints + 1}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Keyboard */}
        {isGuesser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Keyboard className="w-4 h-4" /> Guess a Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
                  {ALPHABET?.map?.((letter: string) => {
                    const isGuessed = guessedSet?.has?.(letter) ?? false;
                    const isIncorrect = incorrectArr?.includes?.(letter) ?? false;
                    return (
                      <Button
                        key={`key-${letter}`}
                        variant={isIncorrect ? 'destructive' : isGuessed ? 'secondary' : 'outline'}
                        size="sm"
                        disabled={isGuessed}
                        onClick={() => onGuessLetter?.(letter)}
                        className={`font-mono font-bold text-sm h-10 ${
                          isGuessed ? 'opacity-40' : 'hover:bg-primary hover:text-primary-foreground'
                        }`}
                      >
                        {letter}
                      </Button>
                    );
                  }) ?? null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Full word guess */}
        {isGuesser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Guess the full word/phrase (-25 pts if wrong)"
                    value={wordGuess}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWordGuess(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleWordGuess()}
                    className="pl-4 flex-1"
                  />
                  <Button onClick={handleWordGuess} disabled={!wordGuess?.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Host spectating message */}
        {!isGuesser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-muted-foreground">
                  You are the Word-Setter. Watch as <span className="font-medium text-foreground">{game?.guesserName ?? 'the guesser'}</span> tries to figure out your word!
                </p>
                <p className="text-sm text-muted-foreground mt-1">The answer: <span className="font-mono font-bold text-primary">{game?.word ?? maskedWord}</span></p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
