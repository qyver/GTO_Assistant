/**
 * Board Analyzer — parses exact board cards and classifies texture.
 * Used for accurate GTO spot matching.
 */

export interface BoardAnalysis {
  cards: string[];
  ranks: number[]; // 14=A, 13=K, 12=Q, 11=J, 10=T, 9..2
  suits: string[];
  suitCounts: Record<string, number>;
  highCard: number;
  midCard: number;
  lowCard: number;
  isPaired: boolean;
  isMonotone: boolean;
  isTwoTone: boolean;
  isRainbow: boolean;
  hasFlushDraw: boolean;
  hasBdFlushDraw: boolean;
  hasOESSD: boolean; // open-ended straight draw
  hasGutshot: boolean;
  connectedness: 'static' | 'semi-connected' | 'connected';
  texture: 'dry' | 'wet' | 'monotone' | 'paired' | 'connected' | 'rainbow';
  category: BoardCategory;
}

export type BoardCategory =
  | 'ace-high-dry'
  | 'ace-high-wet'
  | 'ace-high-monotone'
  | 'broadway-dry'
  | 'broadway-wet'
  | 'high-dry'
  | 'high-wet'
  | 'high-monotone'
  | 'mid-dry'
  | 'mid-wet'
  | 'mid-monotone'
  | 'low-dry'
  | 'low-wet'
  | 'low-connected'
  | 'paired-high'
  | 'paired-low'
  | 'double-paired'
  | 'unknown';

const RANK_MAP: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6,
  '5': 5, '4': 4, '3': 3, '2': 2,
};

/**
 * Parse a single card string like "Ks" → { rank: 13, suit: 's' }
 */
function parseCard(card: string): { rank: number; suit: string } | null {
  const clean = card.trim().toUpperCase();
  // Handle two-char (7s) or three-char (10s → Ts) cards
  const match = clean.match(/^([AKQJT98765432])([SHDC])$/i);
  if (!match) return null;
  const rank = RANK_MAP[match[1].toUpperCase()];
  if (!rank) return null;
  return { rank, suit: match[2].toLowerCase() };
}

/**
 * Detect straight draw possibilities on a 3-card board
 */
function detectStraightDraws(ranks: number[]): {
  hasOESSD: boolean;
  hasGutshot: boolean;
} {
  const sorted = [...ranks].sort((a, b) => b - a);
  let hasOESSD = false;
  let hasGutshot = false;

  // Check all combinations of 2 cards for connectivity
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    gaps.push(sorted[i] - sorted[i + 1]);
  }

  // OESD: two consecutive ranks with room on both ends (e.g., 7-8 on T-high board)
  if (gaps.includes(1) && sorted[0] < 14 && sorted[sorted.length - 1] > 2) {
    hasOESSD = true;
  }

  // Gutshot: ranks within 4 of each other
  const spread = sorted[0] - sorted[sorted.length - 1];
  if (spread <= 4) hasGutshot = true;

  return { hasOESSD, hasGutshot };
}

/**
 * Classify connectedness of the board
 */
function classifyConnectedness(ranks: number[]): 'static' | 'semi-connected' | 'connected' {
  const sorted = [...ranks].sort((a, b) => b - a);
  const maxGap = Math.max(...sorted.slice(0, -1).map((r, i) => r - sorted[i + 1]));

  if (maxGap <= 2) return 'connected';
  if (maxGap <= 4) return 'semi-connected';
  return 'static';
}

/**
 * Classify board category based on analysis
 */
function classifyCategory(analysis: Omit<BoardAnalysis, 'category'>): BoardCategory {
  const { highCard, isPaired, isMonotone, hasFlushDraw, hasOESSD, ranks } = analysis;

  // Double-paired boards
  const rankCounts = ranks.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const pairs = Object.values(rankCounts).filter((c) => c >= 2).length;
  if (pairs >= 2) return 'double-paired';

  // Paired boards
  if (isPaired) {
    return highCard >= 10 ? 'paired-high' : 'paired-low';
  }

  // Monotone
  if (isMonotone) {
    if (highCard === 14) return 'ace-high-monotone';
    if (highCard >= 10) return 'high-monotone';
    return 'mid-monotone';
  }

  const isWet = hasFlushDraw || hasOESSD;

  // Ace-high
  if (highCard === 14) {
    return isWet ? 'ace-high-wet' : 'ace-high-dry';
  }

  // Broadway (KQJ region)
  if (highCard >= 11) {
    return isWet ? 'broadway-wet' : 'broadway-dry';
  }

  // High (T-K)
  if (highCard >= 10) {
    return isWet ? 'high-wet' : 'high-dry';
  }

  // Mid (7-9)
  if (highCard >= 7) {
    return isWet ? 'mid-wet' : 'mid-dry';
  }

  // Low (2-6)
  if (analysis.connectedness === 'connected') return 'low-connected';
  return isWet ? 'low-wet' : 'low-dry';
}

/**
 * Classify overall texture label
 */
function classifyTexture(
  isPaired: boolean,
  isMonotone: boolean,
  hasFlushDraw: boolean,
  hasOESSD: boolean,
  connectedness: string
): BoardAnalysis['texture'] {
  if (isPaired) return 'paired';
  if (isMonotone) return 'monotone';
  if (connectedness === 'connected') return 'connected';
  if (hasFlushDraw || hasOESSD) return 'wet';
  if (!hasFlushDraw && !hasOESSD) return 'dry';
  return 'rainbow';
}

/**
 * Main board analysis function.
 * Accepts exact board string: "Ks7d2c" or "Ks 7d 2c" or array-style "Ks,7d,2c"
 * Returns null if parsing fails.
 */
export function analyzeBoard(board: string): BoardAnalysis | null {
  if (!board || typeof board !== 'string') return null;

  // Normalize: split by spaces, commas, or extract 2-char tokens
  const raw = board.trim().replace(/,/g, ' ').split(/\s+/);
  const tokenized = raw.length >= 3 ? raw : board.match(/[AKQJT98765432][SHDC]/gi) || [];

  if (tokenized.length < 3) return null;

  const parsed = tokenized.slice(0, 5).map(parseCard).filter(Boolean) as Array<{
    rank: number;
    suit: string;
  }>;

  if (parsed.length < 3) return null;

  const cards = tokenized.slice(0, parsed.length).map((c) => c.trim());
  const ranks = parsed.map((p) => p.rank);
  const suits = parsed.map((p) => p.suit);

  // Suit counts
  const suitCounts = suits.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxSuitCount = Math.max(...Object.values(suitCounts));
  const sorted = [...ranks].sort((a, b) => b - a);

  const isPaired = new Set(ranks).size < ranks.length;
  const isMonotone = new Set(suits).size === 1;
  const isTwoTone = !isMonotone && maxSuitCount === 2;
  const isRainbow = new Set(suits).size === 3 && maxSuitCount === 1;
  const hasFlushDraw = isTwoTone; // two-tone = flush draw possible
  const hasBdFlushDraw = isRainbow; // rainbow = backdoor flush draw only

  const { hasOESSD, hasGutshot } = detectStraightDraws(ranks);
  const connectedness = classifyConnectedness(ranks);

  const texture = classifyTexture(isPaired, isMonotone, hasFlushDraw, hasOESSD, connectedness);

  const partial: Omit<BoardAnalysis, 'category'> = {
    cards,
    ranks: sorted,
    suits,
    suitCounts,
    highCard: sorted[0],
    midCard: sorted[1] ?? sorted[0],
    lowCard: sorted[sorted.length - 1],
    isPaired,
    isMonotone,
    isTwoTone,
    isRainbow,
    hasFlushDraw,
    hasBdFlushDraw,
    hasOESSD,
    hasGutshot,
    connectedness,
    texture,
  };

  const category = classifyCategory(partial);

  return { ...partial, category };
}

/**
 * Get board texture label from a string input (exact cards OR texture keyword)
 * Returns a BoardCategory string for matching.
 */
export function getBoardCategory(board: string | undefined): string | null {
  if (!board) return null;

  // Already a texture keyword?
  const textureKeywords = ['dry', 'wet', 'monotone', 'paired', 'connected', 'rainbow'];
  if (textureKeywords.includes(board.toLowerCase())) {
    return board.toLowerCase();
  }

  const analysis = analyzeBoard(board);
  return analysis?.category ?? null;
}
