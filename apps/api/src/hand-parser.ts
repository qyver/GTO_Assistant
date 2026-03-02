/**
 * Hand History Parser — PokerStars & GGPoker format support.
 *
 * Returns a structured ParsedHandSummary with positions, cards, board, actions.
 * Falls back gracefully on unknown formats (returns null for fields it can't extract).
 */

export interface ParsedHandSummary {
  format: 'NLH' | 'PLO' | 'unknown';
  stakes?: string;          // e.g. "$1/$2"
  heroCards?: string;       // e.g. "AhKh"
  heroPosition?: string;    // e.g. "BTN"
  villainCount?: number;
  board?: {
    flop?: string;          // e.g. "Ks7d2c"
    turn?: string;          // e.g. "Jh"
    river?: string;         // e.g. "4s"
  };
  potSize?: number;         // final pot in BB or $
  actions: string[];        // simplified action log
  source: 'pokerstars' | 'ggpoker' | 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// Card normalization helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeRank(r: string): string {
  return r.replace('T', '10').replace('10', 'T');
}

function extractCards(text: string): string | undefined {
  // Match patterns like [Ah Kh] or [AhKh] or [Ah Kh Qd Jc]
  const m = text.match(/\[([2-9TtJjQqKkAa][cdhs][2-9TtJjQqKkAa][cdhs](?:\s[2-9TtJjQqKkAa][cdhs])*)\]/i);
  if (!m) return undefined;
  return m[1].replace(/\s+/g, '');
}

function extractBoardCards(text: string): string | undefined {
  // Match 3-5 cards in brackets
  const m = text.match(/\[([2-9TtJjQqKkAa][cdhs](?:\s[2-9TtJjQqKkAa][cdhs]){2,4})\]/i);
  if (!m) return undefined;
  return m[1].replace(/\s+/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// PokerStars parser
// ─────────────────────────────────────────────────────────────────────────────

function parsePokerStars(text: string): ParsedHandSummary {
  const lines = text.split('\n');
  const result: ParsedHandSummary = { format: 'NLH', actions: [], source: 'pokerstars' };

  // Game type (No Limit Hold'em / PLO)
  if (/Omaha/i.test(text)) result.format = 'PLO';

  // Stakes
  const stakesMatch = text.match(/\(\$?([\d.]+)\/\$?([\d.]+)/);
  if (stakesMatch) result.stakes = `$${stakesMatch[1]}/$${stakesMatch[2]}`;

  // Button seat
  const btnSeatMatch = text.match(/Seat #(\d+) is the button/);
  const btnSeat = btnSeatMatch ? parseInt(btnSeatMatch[1]) : null;

  // Player seats with stacks
  const seats: Record<number, string> = {};
  const seatPattern = /Seat (\d+): (\S+) \(\$?([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = seatPattern.exec(text)) !== null) {
    seats[parseInt(m[1])] = m[2];
  }

  const totalSeats = Object.keys(seats).length;
  if (totalSeats > 0) result.villainCount = totalSeats - 1;

  // Hero cards
  const holeCardLine = lines.find((l) => l.includes('Dealt to') || l.includes('Hole Cards'));
  if (holeCardLine) {
    const cards = extractCards(holeCardLine);
    if (cards) result.heroCards = cards;

    // Try to identify hero's position from name in "Dealt to HeroName [cards]"
    const heroNameMatch = holeCardLine.match(/Dealt to (\S+)/);
    if (heroNameMatch && btnSeat !== null) {
      const heroName = heroNameMatch[1];
      const heroSeat = Object.entries(seats).find(([, name]) => name === heroName)?.[0];
      if (heroSeat) {
        const seatNum = parseInt(heroSeat);
        const seatCount = Object.keys(seats).length;
        // Calculate position relative to button
        const diff = ((seatNum - btnSeat + seatCount) % seatCount);
        result.heroPosition = ['BTN', 'SB', 'BB', 'EP', 'MP', 'CO', 'HJ'][diff] || `Seat ${seatNum}`;
      }
    }
  }

  // Board cards
  const flopLine = lines.find((l) => l.includes('*** FLOP ***'));
  if (flopLine) {
    const cards = extractBoardCards(flopLine);
    if (cards) result.board = { flop: cards.slice(0, 6) };
  }
  const turnLine = lines.find((l) => l.includes('*** TURN ***'));
  if (turnLine && result.board) {
    const allCards = extractBoardCards(turnLine);
    if (allCards && allCards.length >= 8) result.board.turn = allCards.slice(6, 8);
  }
  const riverLine = lines.find((l) => l.includes('*** RIVER ***'));
  if (riverLine && result.board) {
    const allCards = extractBoardCards(riverLine);
    if (allCards && allCards.length >= 10) result.board.river = allCards.slice(8, 10);
  }

  // Actions (simplified)
  const actionPatterns = [
    /(\S+): folds/,
    /(\S+): checks/,
    /(\S+): calls \$?([\d.]+)/,
    /(\S+): bets \$?([\d.]+)/,
    /(\S+): raises .* to \$?([\d.]+)/,
    /(\S+): is all-in/,
  ];
  for (const line of lines) {
    for (const pattern of actionPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.actions.push(line.trim().replace(/\s+/g, ' '));
        break;
      }
    }
  }

  // Pot size
  const potMatch = text.match(/Total pot \$?([\d.]+)/);
  if (potMatch) result.potSize = parseFloat(potMatch[1]);

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// GGPoker parser
// ─────────────────────────────────────────────────────────────────────────────

function parseGGPoker(text: string): ParsedHandSummary {
  const lines = text.split('\n');
  const result: ParsedHandSummary = { format: 'NLH', actions: [], source: 'ggpoker' };

  if (/Omaha/i.test(text)) result.format = 'PLO';

  // Stakes: "NL$0.10/NL$0.25" or "$0.10/$0.25"
  const stakesMatch = text.match(/NL?\$?([\d.]+)\/NL?\$?([\d.]+)/i) || text.match(/\$?([\d.]+)\/\$?([\d.]+)/);
  if (stakesMatch) result.stakes = `$${stakesMatch[1]}/$${stakesMatch[2]}`;

  // Hero cards
  const heroLine = lines.find((l) => /Hero.*\[/.test(l) || /Dealt to Hero/.test(l));
  if (heroLine) {
    result.heroCards = extractCards(heroLine);
  }

  // Board
  const flopLine = lines.find((l) => /Flop:/i.test(l) || /\*\*\* Flop/.test(l));
  if (flopLine) {
    const cards = extractBoardCards(flopLine);
    if (cards) result.board = { flop: cards.slice(0, 6) };
  }
  const turnLine = lines.find((l) => /Turn:/i.test(l) || /\*\*\* Turn/.test(l));
  if (turnLine && result.board) {
    result.board.turn = extractCards(turnLine)?.slice(-2);
  }
  const riverLine = lines.find((l) => /River:/i.test(l) || /\*\*\* River/.test(l));
  if (riverLine && result.board) {
    result.board.river = extractCards(riverLine)?.slice(-2);
  }

  // Actions
  for (const line of lines) {
    if (/\b(folds|checks|calls|bets|raises|all-in)\b/.test(line)) {
      result.actions.push(line.trim());
    }
  }

  // Pot
  const potMatch = text.match(/Total pot \$?([\d.]+)/) || text.match(/Pot: \$?([\d.]+)/);
  if (potMatch) result.potSize = parseFloat(potMatch[1]);

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function detectFormat(text: string): 'pokerstars' | 'ggpoker' | 'unknown' {
  if (/PokerStars Hand/i.test(text)) return 'pokerstars';
  if (/GGPoker/i.test(text) || /GG Poker/i.test(text) || /PokerKing/i.test(text)) return 'ggpoker';
  return 'unknown';
}

export function parseHandHistory(text: string): ParsedHandSummary | null {
  if (!text || text.trim().length < 20) return null;

  const source = detectFormat(text);

  switch (source) {
    case 'pokerstars':
      return parsePokerStars(text);
    case 'ggpoker':
      return parseGGPoker(text);
    default:
      // Return minimal unknown format — AI will handle it
      return {
        format: 'unknown',
        actions: [],
        source: 'unknown',
      };
  }
}
