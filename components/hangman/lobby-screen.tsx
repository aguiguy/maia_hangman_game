'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { GameState } from './hangman-app';
import { Copy, Check, ArrowLeft, Play, Settings, Users, Lightbulb, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  game: GameState;
  role: 'host' | 'guesser' | null;
  onConfigure: (config: {
    word: string; hint1: string; hint2: string; hint3: string;
    penaltyConsonant?: number; penaltyVowel?: number; penaltyHint?: number;
  }) => void;
  onStartGame: () => void;
  onBack: () => void;
}

export default function LobbyScreen({ game, role, onConfigure, onStartGame, onBack }: Props) {
  const [word, setWord] = useState('');
  const [hint1, setHint1] = useState('');
  const [hint2, setHint2] = useState('');
  const [hint3, setHint3] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [penaltyConsonant, setPenaltyConsonant] = useState('');
  const [penaltyVowel, setPenaltyVowel] = useState('');
  const [penaltyHint, setPenaltyHint] = useState('15');
  const [copied, setCopied] = useState(false);
  const [configured, setConfigured] = useState(!!game?.word);

  const gameId = game?.id ?? '';
  const hasGuesser = !!(game?.guesserName);
  const isHost = role === 'host';
  const canStart = configured && hasGuesser && isHost && !!(game?.word);

  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText?.(gameId);
      setCopied(true);
      toast.success('Game ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleConfigure = () => {
    if (!word?.trim() || word.trim().length < 3) {
      toast.error('Word must be at least 3 characters');
      return;
    }
    if (!hint1?.trim() || !hint2?.trim() || !hint3?.trim()) {
      toast.error('Please provide all 3 hints');
      return;
    }
    const config: any = {
      word: word.trim(),
      hint1: hint1.trim(),
      hint2: hint2.trim(),
      hint3: hint3.trim(),
    };
    if (penaltyConsonant) config.penaltyConsonant = parseFloat(penaltyConsonant);
    if (penaltyVowel) config.penaltyVowel = parseFloat(penaltyVowel);
    if (penaltyHint) config.penaltyHint = parseFloat(penaltyHint);
    onConfigure?.(config);
    setConfigured(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Badge variant="secondary" className="text-sm">
            {isHost ? 'Host' : 'Guesser'} · Lobby
          </Badge>
        </motion.div>

        {/* Game ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Share this Game ID with the guesser</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-lg md:text-xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded-lg select-all">
                    {gameId}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Players Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${game?.hostConnected ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                  <div>
                    <p className="font-medium text-sm">{game?.hostName || 'Waiting...'}</p>
                    <p className="text-xs text-muted-foreground">Host (Word-Setter)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${game?.guesserConnected ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                  <div>
                    <p className="font-medium text-sm">{game?.guesserName || 'Waiting...'}</p>
                    <p className="text-xs text-muted-foreground">Guesser</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Host Configuration */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Game Configuration
                </CardTitle>
                <CardDescription>Set the word and hints for the guesser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Word / Phrase</label>
                  <Input
                    placeholder="Enter the word or phrase (min 3 chars)"
                    value={word}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWord(e.target.value)}
                    disabled={configured}
                    className="pl-4"
                  />
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Hints (Hard → Easy)
                  </label>
                  <div className="space-y-3 mt-2">
                    <Input
                      placeholder="Hint 1 (Hardest)"
                      value={hint1}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHint1(e.target.value)}
                      disabled={configured}
                      className="pl-4"
                    />
                    <Input
                      placeholder="Hint 2 (Medium)"
                      value={hint2}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHint2(e.target.value)}
                      disabled={configured}
                      className="pl-4"
                    />
                    <Input
                      placeholder="Hint 3 (Easiest)"
                      value={hint3}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHint3(e.target.value)}
                      disabled={configured}
                      className="pl-4"
                    />
                  </div>
                </div>

                {/* Advanced scoring */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-muted-foreground"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    {showAdvanced ? 'Hide' : 'Show'} Scoring Overrides
                  </Button>
                  {showAdvanced && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Consonant Penalty</label>
                        <Input
                          type="number"
                          placeholder="Auto"
                          value={penaltyConsonant}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyConsonant(e.target.value)}
                          disabled={configured}
                          className="pl-3"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vowel Penalty</label>
                        <Input
                          type="number"
                          placeholder="Auto"
                          value={penaltyVowel}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyVowel(e.target.value)}
                          disabled={configured}
                          className="pl-3"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Hint Penalty</label>
                        <Input
                          type="number"
                          placeholder="15"
                          value={penaltyHint}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPenaltyHint(e.target.value)}
                          disabled={configured}
                          className="pl-3"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!configured ? (
                  <Button onClick={handleConfigure} className="w-full">
                    <Check className="w-4 h-4 mr-2" /> Confirm Configuration
                  </Button>
                ) : (
                  <div className="text-center">
                    <Badge variant="default" className="text-sm px-4 py-1">
                      <Check className="w-4 h-4 mr-1" /> Configured
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Guesser waiting */}
        {!isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <div className="animate-pulse text-muted-foreground">
                  <p className="text-lg font-medium">Waiting for the host to configure the game...</p>
                  <p className="text-sm mt-2">The game will start once the host sets the word and starts the round.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Start button */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onStartGame}
              disabled={!canStart}
              size="lg"
              className="w-full text-lg py-6"
            >
              <Play className="w-5 h-5 mr-2" /> Start Game
            </Button>
            {!canStart && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                {!configured ? 'Configure the word first' : !hasGuesser ? 'Waiting for a guesser to join' : ''}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
