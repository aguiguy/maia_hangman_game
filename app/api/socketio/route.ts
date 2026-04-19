export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  maskWord,
  processLetterGuess,
  processFullWordGuess,
  generateGameId,
  validateWord,
  getWordLetters,
} from '@/lib/game-logic';

// Since Socket.io requires a persistent server which isn't available in
// serverless/edge Next.js deployments, we use a REST-based polling approach.
// The client will poll this endpoint for game state updates.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const role = searchParams.get('role');

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId required' }, { status: 400 });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    // Sanitize - don't reveal word to guesser unless game ended
    const sanitized: any = { ...game };
    if (role !== 'host' && game.status !== 'Ended') {
      delete sanitized.word;
    }

    return NextResponse.json({ success: true, game: sanitized });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;

    switch (action) {
      case 'create-game': {
        const gameId = generateGameId();
        const game = await prisma.game.create({
          data: {
            id: gameId,
            status: 'Lobby',
            hostName: body?.hostName ?? 'Host',
            hostConnected: true,
          },
        });
        return NextResponse.json({ success: true, gameId, game });
      }

      case 'configure-game': {
        const { gameId, word, hint1, hint2, hint3, penaltyConsonant, penaltyVowel, penaltyHint } = body ?? {};
        const validation = validateWord(word ?? '');
        if (!validation.valid) {
          return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
        }
        const masked = maskWord(word?.trim?.() ?? '', new Set());
        const game = await prisma.game.update({
          where: { id: gameId },
          data: {
            word: word?.trim?.() ?? '',
            maskedWord: masked,
            hint1: hint1 ?? '',
            hint2: hint2 ?? '',
            hint3: hint3 ?? '',
            penaltyConsonant: penaltyConsonant != null ? parseFloat(String(penaltyConsonant)) : null,
            penaltyVowel: penaltyVowel != null ? parseFloat(String(penaltyVowel)) : null,
            penaltyHint: penaltyHint != null ? parseFloat(String(penaltyHint)) : 15,
          },
        });
        return NextResponse.json({ success: true, game });
      }

      case 'join-game': {
        const { gameId, guesserName } = body ?? {};
        const game = await prisma.game.findUnique({ where: { id: gameId ?? '' } });
        if (!game) {
          return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        if (game.status === 'Ended') {
          return NextResponse.json({ success: false, error: 'Game already ended' }, { status: 400 });
        }
        if (game.guesserName && game.guesserName !== (guesserName ?? '') && game.guesserConnected) {
          return NextResponse.json({ success: false, error: 'Game already has a guesser' }, { status: 400 });
        }
        const updated = await prisma.game.update({
          where: { id: gameId },
          data: {
            guesserName: guesserName ?? 'Guesser',
            guesserConnected: true,
            status: game.word ? 'Active' : game.status,
          },
        });
        const sanitized: any = { ...updated };
        if (updated.status !== 'Ended') delete sanitized.word;
        return NextResponse.json({ success: true, game: sanitized });
      }

      case 'reconnect-game': {
        const { gameId, name, role } = body ?? {};
        const game = await prisma.game.findUnique({ where: { id: gameId ?? '' } });
        if (!game) {
          return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        const isHost = role === 'host' && game.hostName === name;
        const isGuesser = role === 'guesser' && game.guesserName === name;
        if (!isHost && !isGuesser) {
          return NextResponse.json({ success: false, error: 'Player not found' }, { status: 400 });
        }
        const updateData = isHost ? { hostConnected: true } : { guesserConnected: true };
        const updated = await prisma.game.update({ where: { id: gameId }, data: updateData });
        const result: any = { ...updated };
        if (role !== 'host' && updated.status !== 'Ended') delete result.word;
        return NextResponse.json({ success: true, game: result });
      }

      case 'start-game': {
        const game = await prisma.game.findUnique({ where: { id: body?.gameId ?? '' } });
        if (!game || !game.word || !game.guesserName) {
          return NextResponse.json({ success: false, error: 'Game not ready' }, { status: 400 });
        }
        const updated = await prisma.game.update({
          where: { id: body.gameId },
          data: { status: 'Active' },
        });
        return NextResponse.json({ success: true, game: updated });
      }

      case 'guess-letter': {
        const { gameId, letter } = body ?? {};
        const game = await prisma.game.findUnique({ where: { id: gameId ?? '' } });
        if (!game || game.status !== 'Active') {
          return NextResponse.json({ success: false, error: 'Game not active' }, { status: 400 });
        }
        const guessedArr = game.guessedLetters ? game.guessedLetters.split(',').filter(Boolean) : [];
        const incorrectArr = game.incorrectGuesses ? game.incorrectGuesses.split(',').filter(Boolean) : [];
        const result = processLetterGuess(
          letter ?? '', game.word, game.score, guessedArr, incorrectArr,
          game.penaltyConsonant, game.penaltyVowel
        );
        const newStatus = result.gameOver ? 'Ended' : 'Active';
        const updated = await prisma.game.update({
          where: { id: gameId },
          data: {
            score: result.newScore,
            maskedWord: result.newMaskedWord,
            guessedLetters: result.guessedLetters.join(','),
            incorrectGuesses: result.incorrectGuesses.join(','),
            status: newStatus,
            winner: result.gameOver ? (result.won ? 'guesser' : 'host') : '',
          },
        });
        return NextResponse.json({ success: true, result, game: { ...updated, word: newStatus === 'Ended' ? updated.word : undefined } });
      }

      case 'guess-word': {
        const { gameId, word: guessWord } = body ?? {};
        const game = await prisma.game.findUnique({ where: { id: gameId ?? '' } });
        if (!game || game.status !== 'Active') {
          return NextResponse.json({ success: false, error: 'Game not active' }, { status: 400 });
        }
        const guessedArr = game.guessedLetters ? game.guessedLetters.split(',').filter(Boolean) : [];
        const incorrectArr = game.incorrectGuesses ? game.incorrectGuesses.split(',').filter(Boolean) : [];
        const result = processFullWordGuess(guessWord ?? '', game.word, game.score, guessedArr, incorrectArr);
        const newStatus = result.gameOver ? 'Ended' : 'Active';
        const updated = await prisma.game.update({
          where: { id: gameId },
          data: {
            score: result.newScore,
            maskedWord: result.newMaskedWord,
            guessedLetters: result.guessedLetters.join(','),
            incorrectGuesses: result.incorrectGuesses.join(','),
            status: newStatus,
            winner: result.gameOver ? (result.won ? 'guesser' : 'host') : '',
          },
        });
        return NextResponse.json({ success: true, result, game: { ...updated, word: newStatus === 'Ended' ? updated.word : undefined } });
      }

      case 'request-hint': {
        const game = await prisma.game.findUnique({ where: { id: body?.gameId ?? '' } });
        if (!game || game.status !== 'Active') {
          return NextResponse.json({ success: false, error: 'Game not active' }, { status: 400 });
        }
        if (game.revealedHints >= 3) {
          return NextResponse.json({ success: false, error: 'All hints revealed' }, { status: 400 });
        }
        const hintPenalty = game.penaltyHint ?? 15;
        const newScore = Math.max(0, game.score - hintPenalty);
        const newRevealed = game.revealedHints + 1;
        const hints = [game.hint1, game.hint2, game.hint3];
        const gameOver = newScore <= 0;
        const updated = await prisma.game.update({
          where: { id: body.gameId },
          data: {
            score: Math.round(newScore * 100) / 100,
            revealedHints: newRevealed,
            status: gameOver ? 'Ended' : 'Active',
            winner: gameOver ? 'host' : '',
          },
        });
        return NextResponse.json({
          success: true,
          hint: hints[newRevealed - 1] ?? '',
          hintNumber: newRevealed,
          penalty: hintPenalty,
          game: { ...updated, word: gameOver ? updated.word : undefined },
        });
      }

      case 'replay-game': {
        const oldGame = await prisma.game.findUnique({ where: { id: body?.gameId ?? '' } });
        if (!oldGame) {
          return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        const newId = generateGameId();
        const newGame = await prisma.game.create({
          data: {
            id: newId,
            status: 'Lobby',
            hostName: oldGame.hostName,
            hostConnected: true,
          },
        });
        return NextResponse.json({ success: true, newGameId: newId, game: newGame });
      }

      case 'disconnect': {
        const { gameId, role } = body ?? {};
        if (gameId && role) {
          const updateData = role === 'host' ? { hostConnected: false } : { guesserConnected: false };
          await prisma.game.update({ where: { id: gameId }, data: updateData }).catch(() => null);
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Socket API error:', err);
    return NextResponse.json({ success: false, error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
