'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { GameState } from './hangman-app';
import { Trophy, Frown, RotateCcw, Home, Star, Target, Zap } from 'lucide-react';

interface Props {
  game: GameState;
  role: 'host' | 'guesser' | null;
  playerName: string;
  onReplay: () => void;
  onHome: () => void;
}

export default function EndScreen({ game, role, playerName, onReplay, onHome }: Props) {
  const winner = game?.winner ?? '';
  const isGuesser = role === 'guesser';
  const guesserWon = winner === 'guesser';
  const iWon = (isGuesser && guesserWon) || (!isGuesser && !guesserWon);
  const finalScore = game?.score ?? 0;
  const word = game?.word ?? game?.maskedWord ?? '';
  const incorrectArr = game?.incorrectGuesses?.split?.(',')?.filter?.(Boolean) ?? [];
  const hintsUsed = game?.revealedHints ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 ${
            iWon ? 'bg-emerald-500/10' : 'bg-destructive/10'
          }`}>
            {iWon
              ? <Trophy className="w-12 h-12 text-emerald-500" />
              : <Frown className="w-12 h-12 text-destructive" />
            }
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {guesserWon ? 'Word Guessed!' : 'Game Over!'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {guesserWon
              ? `${game?.guesserName ?? 'The guesser'} cracked the word!`
              : `${game?.guesserName ?? 'The guesser'} ran out of points.`
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" /> Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">The Word Was</p>
                <p className="text-3xl font-bold font-mono tracking-widest text-primary">
                  {word?.toUpperCase?.() ?? ''}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold font-mono">{finalScore?.toFixed?.(1) ?? '0'}</p>
                  <p className="text-xs text-muted-foreground">Final Score</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-2xl font-bold font-mono">{incorrectArr?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Wrong Guesses</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold font-mono">{hintsUsed}</p>
                  <p className="text-xs text-muted-foreground">Hints Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          {role === 'host' && (
            <Button onClick={onReplay} className="flex-1" size="lg">
              <RotateCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
          )}
          <Button onClick={onHome} variant="outline" className="flex-1" size="lg">
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
