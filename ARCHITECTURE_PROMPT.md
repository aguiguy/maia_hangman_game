# ARCHITECTURE DESIGN PROMPT: Real-Time Word Guessing Game

## 1. OBJECTIVE
Design and build a real-time, 2-player synchronous word guessing game using the specifications below. The agent must define the system boundaries, data schemas, API contracts, and real-time synchronization strategy.

## 2. GAME SPECIFICATION

### Application Overview
Build an **online multiplayer Hangman web application** where two players interact in real-time:

- **Word-Setter (Host)** creates a game and defines the puzzle
- **Word-Guesser (Player)** joins and attempts to solve it

---

### Core Game Flow

1. Word-Setter creates a new game:
   - System generates a **unique 20-character alphanumeric Game ID**
   - Word-Setter shares Game ID with Word-Guesser

2. Word-Setter configures the game:
   - Inputs a **Guess Word or Phrase**
   - Provides **3 hints** (hard → easy, revealed on request)
   - Optionally overrides scoring rules

3. Word-Guesser joins:
   - Enters Game ID
   - Provides player name

4. Gameplay:
   - Guesser selects letters or attempts full word
   - System evaluates guesses:
     - Correct → reveal letters
     - Incorrect → track and penalize
   - Guesser may request hints (costs points)

5. Game ends when:
   - Word is fully guessed OR
   - Score reaches zero OR
   - Player submits correct full-word guess

---

### Scoring Rules

- Initial score: **100 points**
- Incorrect consonant guess:
  - Deduct: `100 / (word length)`
- Incorrect vowel guess:
  - Deduct: `2 × (100 / word length)`
- Hint request:
  - Deduct: **15 points**
- Word-Setter may override deduction values

---

### Functional Capabilities

#### Word-Setter (Host)
- Create game with name
- Generate Game ID
- Define:
  - Word/Phrase
  - 3 hints (ordered)
- Configure scoring overrides
- Start game

#### Word-Guesser (Player)
- Join game via Game ID
- Submit:
  - Letter guesses
  - Full-word guesses
- Request hints
- View score and progress

---

### UI Components (Functional Description Only)

#### Core Elements
- Word display as letter boxes (supports multi-word phrases)
- Incorrect guesses list
- On-screen keyboard (A–Z)
- Optional text input for guesses
- Score display
- Game ID display + copy/share
- Player names and status

#### Game States
- Lobby (waiting for players)
- Active gameplay
- End game (results, replay option)

#### Feedback System
- Immediate feedback:
  - Correct / incorrect guess
  - Score changes
- Connection status:
  - Reconnecting / disconnected alerts

---

### Constraints & Notes

- Real-time synchronization between players
- Prevent duplicate guesses
- Case-insensitive input handling
- Preserve punctuation in phrases such that the punctuation appears in the displayed Guess Word in the appropriate position within the letter boxes.

---


## 3. CORE DOMAIN MODEL

### Game State
- **ID:** Unique 20-character alphanumeric string.
- **Status:** `Lobby` | `Active` | `Ended`
- **Word Data:** Original word (Host-set), Masked word (Guesser-view), Revealed letters.
- **Rules:** Score (starts at 100), Penalty Config (Vowels vs. Consonants), Hint Cost.
- **Activity:** Guess history (array), Incorrect guess list, Hint reveals (index 0-2).

### Player Model
- **Roles:** `Host` (Word-setter), `Guesser` (Player).
- **Attributes:** Name, ID, Connection Status (`Connected`, `Reconnecting`, `Disconnected`).

## 4. FUNCTIONAL FLOWS & LOGIC

### 4.1 Setup & Initialization
- **Creation:** Host generates Game ID and enters Lobby.
- **Configuration:** Host sets Word (A-Z + punctuation) and 3 ordered hints.
- **Joining:** Guesser joins via ID. Game transitions to `Active` when Host starts.

### 4.2 Gameplay Logic (Pure Functions)
- **Letter Masking:** Auto-reveal punctuation/spaces on initialization.
- **Letter Guessing:** 
  - Case-insensitive comparison.
  - **Correct:** Update revealed letters; no penalty.
  - **Incorrect:** Deduct `100 / word_length` for Consonants, `2x` that for Vowels.
- **Full Word Guess:** Instant Win on match; standard Consonant penalty on fail.
- **Hint Reveal:** Deduct 15 points; reveal hints in strictly ordered sequence (1 → 2 → 3).

### 4.3 End States
- **Win:** All letters revealed OR correct Full Word guess.
- **Loss:** Score reaches ≤ 0.
- **Reset:** "Play Again" preserves settings but instantiates a new Game ID and score.

## 5. TECHNICAL STACK & CONSTRAINTS

- **Backend:** Node.js (Express preferred).
- **Frontend:** React (Tailwind CSS, Webpack).
- **Communication:** Real-time synchronization required (e.g., WebSockets/Socket.io).
- **State/Persistence:** 
  - **Client:** `localStorage`.
  - **Server:** Server-side filesystem storage for session state.
- **Security:** TLS/HTTPS enforcement; input sanitization.

## 6. ARCHITECTURAL PRINCIPLES

- **Pattern:** Monolith.
- **Separation of Concerns:** 
  - **Business Logic:** Must reside in pure, synchronous functions (zero side effects).
  - **Orchestration:** Effectful functions (API handlers, socket events) handle state updates and I/O.
- **Modularity:** Atomic functions, loosely coupled modules, and explicit interfaces.
- **State Management:** Implement a single source of truth for game state that syncs across both clients.

## 7. EDGE CASE & DISCONNECT HANDLING
- **Persistence:** Game state must survive a browser refresh.
- **Reconnection:** Allow players to rejoin a session using their existing Game ID and name.
- **Validation:** Block duplicate guesses; enforce a minimum word length of 3 characters.

## 8. ARCHITECT OUTPUT REQUIREMENTS
1. **Data Schema:** Define the JSON structure for the Game and Player entities.
2. **API/Event Contract:** Define the messages transferred between Client and Server.
3. **State Management Flow:** Detail how the "Word Display" updates in real-time.
4. **Implementation Plan:** List the steps to build, starting from the data layer to the UI components.

---

### INSTRUCTION TO AGENT
Analyze the above specification. If any logic is insufficient for a production-ready build using Deep Agent, request clarification immediately. Otherwise, proceed to build the system using the specified tech stack and build using DeepAgent.
