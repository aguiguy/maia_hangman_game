// Pure business logic functions for Hangman game

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const ALPHA = /^[A-Z]$/;

export function generateGameId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function maskWord(word: string, guessedLetters: Set<string>): string {
  return word
    .split('')
    .map((ch: string) => {
      const upper = ch?.toUpperCase?.() ?? '';
      if (!ALPHA.test(upper)) return ch; // punctuation, spaces, numbers revealed
      if (guessedLetters.has(upper)) return ch;
      return '_';
    })
    .join('');
}

export function getWordLetters(word: string): Set<string> {
  const letters = new Set<string>();
  for (const ch of word) {
    const upper = ch?.toUpperCase?.() ?? '';
    if (ALPHA.test(upper)) letters.add(upper);
  }
  return letters;
}

export function calculatePenalty(
  letter: string,
  wordLength: number,
  customConsonant?: number | null,
  customVowel?: number | null
): number {
  const letterCount = wordLength; // number of alphabetic chars in word
  const basePenalty = letterCount > 0 ? 100 / letterCount : 10;
  const isVowel = VOWELS.has(letter?.toUpperCase?.() ?? '');

  if (isVowel) {
    return customVowel ?? (2 * basePenalty);
  }
  return customConsonant ?? basePenalty;
}

export function getAlphabeticLength(word: string): number {
  let count = 0;
  for (const ch of word ?? '') {
    if (ALPHA.test(ch?.toUpperCase?.() ?? '')) count++;
  }
  return count;
}

export interface GuessResult {
  correct: boolean;
  letter?: string;
  penalty: number;
  newScore: number;
  newMaskedWord: string;
  guessedLetters: string[];
  incorrectGuesses: string[];
  gameOver: boolean;
  won: boolean;
  isFullWord?: boolean;
}

export function processLetterGuess(
  letter: string,
  word: string,
  currentScore: number,
  guessedLettersArr: string[],
  incorrectGuessesArr: string[],
  customConsonant?: number | null,
  customVowel?: number | null
): GuessResult {
  const upperLetter = letter?.toUpperCase?.() ?? '';
  const guessedSet = new Set(guessedLettersArr?.map?.((l: string) => l?.toUpperCase?.() ?? '') ?? []);
  
  // Already guessed
  if (guessedSet.has(upperLetter)) {
    return {
      correct: false,
      letter: upperLetter,
      penalty: 0,
      newScore: currentScore,
      newMaskedWord: maskWord(word, guessedSet),
      guessedLetters: guessedLettersArr ?? [],
      incorrectGuesses: incorrectGuessesArr ?? [],
      gameOver: false,
      won: false,
    };
  }

  guessedSet.add(upperLetter);
  const newGuessedLetters = [...(guessedLettersArr ?? []), upperLetter];
  const wordLetters = getWordLetters(word);
  const isCorrect = wordLetters.has(upperLetter);
  const alphaLen = getAlphabeticLength(word);

  let penalty = 0;
  let newIncorrect = [...(incorrectGuessesArr ?? [])];

  if (!isCorrect) {
    penalty = calculatePenalty(upperLetter, alphaLen, customConsonant, customVowel);
    newIncorrect = [...newIncorrect, upperLetter];
  }

  const newScore = Math.max(0, currentScore - penalty);
  const newMaskedWord = maskWord(word, guessedSet);
  const won = !newMaskedWord.includes('_');
  const gameOver = won || newScore <= 0;

  return {
    correct: isCorrect,
    letter: upperLetter,
    penalty: Math.round(penalty * 100) / 100,
    newScore: Math.round(newScore * 100) / 100,
    newMaskedWord,
    guessedLetters: newGuessedLetters,
    incorrectGuesses: newIncorrect,
    gameOver,
    won,
  };
}

export function processFullWordGuess(
  guess: string,
  word: string,
  currentScore: number,
  guessedLettersArr: string[],
  incorrectGuessesArr: string[]
): GuessResult {
  const normalizedGuess = guess?.trim?.()?.toUpperCase?.() ?? '';
  const normalizedWord = word?.trim?.()?.toUpperCase?.() ?? '';
  const isCorrect = normalizedGuess === normalizedWord;

  if (isCorrect) {
    // Reveal all letters
    const allLetters = getWordLetters(word);
    const newGuessedLetters = Array.from(allLetters);
    return {
      correct: true,
      penalty: 0,
      newScore: currentScore,
      newMaskedWord: word,
      guessedLetters: newGuessedLetters,
      incorrectGuesses: incorrectGuessesArr ?? [],
      gameOver: true,
      won: true,
      isFullWord: true,
    };
  }

  // Wrong full-word guess: big penalty (25 points)
  const penalty = 25;
  const newScore = Math.max(0, currentScore - penalty);
  const guessedSet = new Set(guessedLettersArr?.map?.((l: string) => l?.toUpperCase?.() ?? '') ?? []);

  return {
    correct: false,
    penalty,
    newScore: Math.round(newScore * 100) / 100,
    newMaskedWord: maskWord(word, guessedSet),
    guessedLetters: guessedLettersArr ?? [],
    incorrectGuesses: incorrectGuessesArr ?? [],
    gameOver: newScore <= 0,
    won: false,
    isFullWord: true,
  };
}

export function validateWord(word: string): { valid: boolean; error?: string } {
  if (!word || word.trim().length < 3) {
    return { valid: false, error: 'Word must be at least 3 characters long' };
  }
  const alphaCount = getAlphabeticLength(word.trim());
  if (alphaCount < 3) {
    return { valid: false, error: 'Word must contain at least 3 alphabetic characters' };
  }
  return { valid: true };
}
