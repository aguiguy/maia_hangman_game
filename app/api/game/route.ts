export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateGameId, maskWord, validateWord } from '@/lib/game-logic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === 'create') {
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

    if (action === 'configure') {
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
          penaltyConsonant: penaltyConsonant ?? null,
          penaltyVowel: penaltyVowel ?? null,
          penaltyHint: penaltyHint ?? 15,
        },
      });
      return NextResponse.json({ success: true, game });
    }

    if (action === 'get') {
      const game = await prisma.game.findUnique({ where: { id: body?.gameId ?? '' } });
      if (!game) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, game });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
