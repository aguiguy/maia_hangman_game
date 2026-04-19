'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, UserPlus, PenLine, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onCreateGame: (name: string) => void;
  onJoinGame: (gameId: string, name: string) => void;
}

export default function LandingScreen({ onCreateGame, onJoinGame }: Props) {
  const [hostName, setHostName] = useState('');
  const [guesserName, setGuesserName] = useState('');
  const [gameId, setGameId] = useState('');

  const handleCreate = () => {
    if (!hostName?.trim()) {
      toast.error('Please enter your name');
      return;
    }
    onCreateGame?.(hostName.trim());
  };

  const handleJoin = () => {
    if (!guesserName?.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!gameId?.trim()) {
      toast.error('Please enter a Game ID');
      return;
    }
    onJoinGame?.(gameId.trim(), guesserName.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
          <Gamepad2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-3">
          Hang<span className="text-primary">man</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          A real-time multiplayer word guessing game. Create a game or join one to start playing.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-md"
      >
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <PenLine className="w-4 h-4" /> Create Game
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Join Game
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Create a New Game</CardTitle>
                <CardDescription>Set up a word for others to guess</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={hostName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHostName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCreate()}
                    className="pl-4"
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" size="lg">
                  <Gamepad2 className="w-4 h-4 mr-2" /> Create Game
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Join a Game</CardTitle>
                <CardDescription>Enter the Game ID shared by the host</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={guesserName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuesserName(e.target.value)}
                    className="pl-4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Game ID</label>
                  <Input
                    placeholder="Paste the 20-character Game ID"
                    value={gameId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGameId(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleJoin()}
                    className="pl-4 font-mono"
                  />
                </div>
                <Button onClick={handleJoin} className="w-full" size="lg">
                  <UserPlus className="w-4 h-4 mr-2" /> Join Game
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
