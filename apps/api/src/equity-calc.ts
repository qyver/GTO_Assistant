/**
 * Equity Calculator — Monte Carlo simulation for hand vs hand equity.
 *
 * Supports 2-player hand-vs-hand matchups.
 * Uses simplified 7-card hand evaluator (fast, no lookup tables needed).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Card types
// ─────────────────────────────────────────────────────────────────────────────

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['c', 'd', 'h', 's'];
const RANK_VAL: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

interface Card { rank: number; suit: string }

function parseCard(s: string): Card | null {
  s = s.trim().replace(/10/g, 'T');
  if (s.length < 2) return null;
  const rank = RANK_VAL[s[0].toUpperCase()];
  const suit = s[1].toLowerCase();
  if (!rank || !SUITS.includes(suit)) return null;
  return { rank, suit };
}

export function parseHand(hand: string): [Card, Card] | null {
  hand = hand.trim().replace(/\s+/g, '');
  if (hand.length < 4) return null;
  // Accept "AhKh" or "Ah Kh"
  const parts = hand.match(/([2-9TtJjQqKkAa][cdhs])/gi);
  if (!parts || parts.length < 2) return null;
  const c1 = parseCard(parts[0]);
  const c2 = parseCard(parts[1]);
  if (!c1 || !c2) return null;
  return [c1, c2];
}

// ─────────────────────────────────────────────────────────────────────────────
// Deck
// ─────────────────────────────────────────────────────────────────────────────

function buildDeck(excluded: Card[]): Card[] {
  const excSet = new Set(excluded.map((c) => `${c.rank}${c.suit}`));
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      const card: Card = { rank: RANK_VAL[r], suit: s };
      if (!excSet.has(`${card.rank}${card.suit}`)) deck.push(card);
    }
  }
  return deck;
}

function shuffle(deck: Card[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5-card hand evaluator — returns a comparable score
// Higher = better hand
// ─────────────────────────────────────────────────────────────────────────────

function evaluateFive(cards: Card[]): number {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const rankCounts: Record<number, number> = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const suitCounts: Record<string, number> = {};
  for (const s of suits) suitCounts[s] = (suitCounts[s] || 0) + 1;

  const isFlush = Object.values(suitCounts).some((c) => c >= 5);
  const sortedRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  for (let i = 0; i <= sortedRanks.length - 5; i++) {
    if (sortedRanks[i] - sortedRanks[i + 4] === 4) {
      isStraight = true;
      straightHigh = sortedRanks[i];
    }
  }
  // Wheel straight (A-2-3-4-5)
  if (!isStraight && sortedRanks.includes(14) && sortedRanks.slice(-4).join(',') === '5,4,3,2') {
    isStraight = true;
    straightHigh = 5;
  }

  // Encode rank groups for tiebreaking
  const grouped = Object.entries(rankCounts)
    .sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]))
    .map(([r]) => parseInt(r));

  // Encode: category * 1e10 + kicker1 * 1e8 + kicker2 * 1e6 + ...
  const k = (r: number, pos: number) => r * Math.pow(100, 5 - pos);

  if (isStraight && isFlush) return 8e12 + straightHigh;
  if (counts[0] === 4) return 7e12 + k(grouped[0], 0) + k(grouped[1], 1);
  if (counts[0] === 3 && counts[1] === 2) return 6e12 + k(grouped[0], 0) + k(grouped[1], 1);
  if (isFlush) {
    const flushSuit = Object.entries(suitCounts).find(([, c]) => c >= 5)![0];
    const fr = cards.filter((c) => c.suit === flushSuit).map((c) => c.rank).sort((a, b) => b - a);
    return 5e12 + fr.slice(0, 5).reduce((acc, r, i) => acc + k(r, i), 0);
  }
  if (isStraight) return 4e12 + straightHigh;
  if (counts[0] === 3) return 3e12 + grouped.reduce((acc, r, i) => acc + k(r, i), 0);
  if (counts[0] === 2 && counts[1] === 2) return 2e12 + grouped.reduce((acc, r, i) => acc + k(r, i), 0);
  if (counts[0] === 2) return 1e12 + grouped.reduce((acc, r, i) => acc + k(r, i), 0);
  return grouped.reduce((acc, r, i) => acc + k(r, i), 0);
}

function bestFive(cards: Card[]): number {
  // Try all C(7,5) = 21 combinations
  let best = -Infinity;
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const five = cards.filter((_, idx) => idx !== i && idx !== j);
      const score = evaluateFive(five);
      if (score > best) best = score;
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monte Carlo
// ─────────────────────────────────────────────────────────────────────────────

export interface EquityResult {
  heroWin: number;   // 0-100
  villainWin: number;
  tie: number;
  iterations: number;
  heroHand: string;
  villainHand: string;
}

export function calculateEquity(
  heroHandStr: string,
  villainHandStr: string,
  boardStr?: string,
  iterations = 5000
): EquityResult | { error: string } {
  const hero = parseHand(heroHandStr);
  if (!hero) return { error: `Invalid hero hand: "${heroHandStr}". Use format like "AhKh"` };

  const villain = parseHand(villainHandStr);
  if (!villain) return { error: `Invalid villain hand: "${villainHandStr}". Use format like "QdQc"` };

  // Check for duplicate cards
  const allHoleCards = [...hero, ...villain];
  const cardSet = new Set(allHoleCards.map((c) => `${c.rank}${c.suit}`));
  if (cardSet.size < 4) return { error: 'Duplicate cards between hands' };

  // Parse known board cards
  let knownBoard: Card[] = [];
  if (boardStr) {
    const parts = boardStr.match(/([2-9TtJjQqKkAa][cdhs])/gi) || [];
    knownBoard = parts.map((s) => parseCard(s)).filter((c): c is Card => c !== null);
  }

  let heroWins = 0, villainWins = 0, ties = 0;
  const deck = buildDeck([...hero, ...villain, ...knownBoard]);

  for (let i = 0; i < iterations; i++) {
    shuffle(deck);
    const board = [...knownBoard, ...deck.slice(0, 5 - knownBoard.length)];

    const heroScore = bestFive([...hero, ...board]);
    const villainScore = bestFive([...villain, ...board]);

    if (heroScore > villainScore) heroWins++;
    else if (villainScore > heroScore) villainWins++;
    else ties++;
  }

  return {
    heroWin: parseFloat(((heroWins / iterations) * 100).toFixed(1)),
    villainWin: parseFloat(((villainWins / iterations) * 100).toFixed(1)),
    tie: parseFloat(((ties / iterations) * 100).toFixed(1)),
    iterations,
    heroHand: heroHandStr,
    villainHand: villainHandStr,
  };
}
