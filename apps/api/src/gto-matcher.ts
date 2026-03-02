/**
 * GTO Matcher — weighted fuzzy matching with stack interpolation.
 *
 * Scoring weights:
 *   format + positions (required)  — disqualify if mismatch
 *   stackBucket match              — 0-25 pts (linear falloff)
 *   potType match                  — 0-20 pts
 *   boardCategory match            — 0-30 pts (most impactful)
 *   exact texture family           — 0-5 pts bonus
 */

import path from 'path';
import fs from 'fs';
import type { GTOSpotQuery, GTORecommendation } from '@pokerbotai/shared';
import { analyzeBoard, getBoardCategory } from './board-analyzer';

interface SpotEntry {
  key: string;
  format: string;
  stackBucket: number;
  positions: { hero: string; villain: string };
  potType: 'srp' | '3bet' | '4bet';
  boardCategory: string;
  actions: Array<{ type: string; frequency: number; sizes?: number[] }>;
  sizes: Array<{ size: number; frequency: number }>;
  notesDry: string;
  ev?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────────────────────────────────────

let _spots: SpotEntry[] | null = null;

function loadSpots(): SpotEntry[] {
  if (_spots) return _spots;

  const dataDir = path.join(__dirname, '../data/gto');
  const files = ['cash-srp.json', 'cash-3bet.json', 'tourney.json'];

  const all: SpotEntry[] = [];
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const spots: SpotEntry[] = JSON.parse(content);
      all.push(...spots);
    } catch (err) {
      console.warn(`[GTO Matcher] Could not load ${file}:`, err);
    }
  }

  console.log(`[GTO Matcher] Loaded ${all.length} spots from ${files.length} files`);
  _spots = all;
  return _spots;
}

export function getAllSpotKeys(): string[] {
  return loadSpots().map((s) => s.key);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pot Type Detection
// ─────────────────────────────────────────────────────────────────────────────

function detectPotType(preset?: string): 'srp' | '3bet' | '4bet' {
  if (!preset) return 'srp';
  const p = preset.toLowerCase();
  if (p.includes('4bet')) return '4bet';
  if (p.includes('3bet')) return '3bet';
  return 'srp';
}

// ─────────────────────────────────────────────────────────────────────────────
// Board Category Grouping (for partial texture matching)
// ─────────────────────────────────────────────────────────────────────────────

const TEXTURE_FAMILIES: Record<string, string[]> = {
  dry: ['ace-high-dry', 'broadway-dry', 'high-dry', 'mid-dry', 'low-dry', 'paired-high', 'paired-low'],
  wet: ['ace-high-wet', 'broadway-wet', 'high-wet', 'mid-wet', 'low-wet', 'low-connected'],
  monotone: ['ace-high-monotone', 'high-monotone', 'mid-monotone'],
  paired: ['paired-high', 'paired-low', 'double-paired'],
};

function getTextureFamilyFromCategory(cat: string): string | null {
  for (const [family, cats] of Object.entries(TEXTURE_FAMILIES)) {
    if (cats.includes(cat)) return family;
  }
  return null;
}

function boardScore(queryBoard: string | undefined, spotCategory: string): number {
  if (!queryBoard) return 5; // No board info — neutral bonus

  // Query is an exact board (e.g. "Ks7d2c")
  const analysis = analyzeBoard(queryBoard);
  if (analysis) {
    if (analysis.category === spotCategory) return 30; // Exact category match
    const qFamily = getTextureFamilyFromCategory(analysis.category);
    const sFamily = getTextureFamilyFromCategory(spotCategory);
    if (qFamily && qFamily === sFamily) return 15; // Same family
    if (analysis.texture === spotCategory) return 12; // Texture keyword match
    return 3; // Different
  }

  // Query is a texture keyword (dry/wet/monotone...)
  const queryTexture = queryBoard.toLowerCase();
  if (queryTexture === spotCategory) return 22;
  const qFamily = getTextureFamilyFromCategory(queryTexture);
  const sFamily = getTextureFamilyFromCategory(spotCategory);
  if (qFamily && qFamily === sFamily) return 12;
  return 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack Scoring (linear interpolation)
// ─────────────────────────────────────────────────────────────────────────────

function stackScore(queryStack: number, spotBucket: number): number {
  const diff = Math.abs(queryStack - spotBucket);
  if (diff === 0) return 25;
  if (diff <= 5) return 22;
  if (diff <= 10) return 18;
  if (diff <= 15) return 13;
  if (diff <= 20) return 8;
  if (diff <= 30) return 4;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack Interpolation
// ─────────────────────────────────────────────────────────────────────────────

function interpolateFrequencies(
  low: SpotEntry,
  high: SpotEntry,
  stack: number
): SpotEntry['actions'] {
  const t = (stack - low.stackBucket) / (high.stackBucket - low.stackBucket);

  // Merge action types from both
  const types = new Set([
    ...low.actions.map((a) => a.type),
    ...high.actions.map((a) => a.type),
  ]);

  return Array.from(types).map((type) => {
    const lo = low.actions.find((a) => a.type === type);
    const hi = high.actions.find((a) => a.type === type);
    const loFreq = lo?.frequency ?? 0;
    const hiFreq = hi?.frequency ?? 0;
    const freq = Math.round(loFreq + (hiFreq - loFreq) * t);
    const sizes = hi?.sizes ?? lo?.sizes;
    return { type, frequency: freq, ...(sizes ? { sizes } : {}) };
  }).filter((a) => a.frequency > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Score a single spot against query
// ─────────────────────────────────────────────────────────────────────────────

function scoreSpot(spot: SpotEntry, query: GTOSpotQuery, potType: string): number {
  // Hard disqualifiers
  if (spot.format !== query.format) return 0;
  if (spot.positions.hero !== query.positions.hero) return 0;
  if (spot.positions.villain !== query.positions.villain) return 0;

  let score = 0;

  // Stack (0-25)
  score += stackScore(query.stack, spot.stackBucket);

  // Pot type (0-20)
  if (spot.potType === potType) score += 20;
  else if (
    (spot.potType === 'srp' && potType === '3bet') ||
    (spot.potType === '3bet' && potType === 'srp')
  ) {
    score += 5; // Adjacent pot type
  }

  // Board category (0-30)
  score += boardScore(query.board?.toString(), spot.boardCategory);

  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence reason string
// ─────────────────────────────────────────────────────────────────────────────

function buildConfidenceReason(score: number, spot: SpotEntry, query: GTOSpotQuery): string {
  if (score >= 70) return `Exact match (${spot.key})`;
  if (score >= 50) return `Close match — ${spot.boardCategory} category, ${spot.stackBucket}bb`;
  if (score >= 30) return `Approximate — different board texture or stack`;
  return `Low confidence — best available, verify independently`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main match function
// ─────────────────────────────────────────────────────────────────────────────

export function matchSpot(query: GTOSpotQuery): GTORecommendation {
  const spots = loadSpots();
  const potType = detectPotType(query.spotPreset);

  // Score all spots
  const scored = spots
    .map((spot) => ({ spot, score: scoreSpot(spot, query, potType) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // No matches at all
  if (scored.length === 0) {
    return {
      actions: [
        { type: 'bet', frequency: 50 },
        { type: 'check', frequency: 50 },
      ],
      sizes: [{ size: 50, frequency: 50 }],
      notesDry: 'No matching GTO data found. Use fundamental poker logic.',
      meta: {
        matchedKey: 'none',
        confidence: 0,
        suggestions: ['Try a more standard spot configuration', 'Check position and format'],
      },
    };
  }

  const best = scored[0];
  let actions = best.spot.actions.map((a) => ({ ...a }));
  let notesDry = best.spot.notesDry;

  // Stack interpolation: if we have a lower and higher bracket neighbor
  const lowSide = spots
    .filter(
      (s) =>
        s.format === query.format &&
        s.positions.hero === query.positions.hero &&
        s.positions.villain === query.positions.villain &&
        s.boardCategory === best.spot.boardCategory &&
        s.potType === best.spot.potType &&
        s.stackBucket < query.stack
    )
    .sort((a, b) => b.stackBucket - a.stackBucket)[0];

  const highSide = spots
    .filter(
      (s) =>
        s.format === query.format &&
        s.positions.hero === query.positions.hero &&
        s.positions.villain === query.positions.villain &&
        s.boardCategory === best.spot.boardCategory &&
        s.potType === best.spot.potType &&
        s.stackBucket > query.stack
    )
    .sort((a, b) => a.stackBucket - b.stackBucket)[0];

  if (lowSide && highSide) {
    actions = interpolateFrequencies(lowSide, highSide, query.stack);
    notesDry += ` (interpolated between ${lowSide.stackBucket}bb and ${highSide.stackBucket}bb)`;
  }

  // Confidence: cap at 95 for precomputed data
  const rawScore = best.score;
  const confidence = Math.min(95, Math.round((rawScore / 75) * 95));

  const suggestions: string[] = [];
  if (confidence < 80) {
    const next = scored[1];
    if (next) suggestions.push(`Alternative: ${next.spot.key} (score ${next.score})`);
  }
  if (scored.length > 1) {
    suggestions.push(`${scored.length - 1} other similar spots available`);
  }

  return {
    actions: actions.filter((a) => a.frequency > 0) as import('@pokerbotai/shared').GTOAction[],
    sizes: best.spot.sizes.map((s) => ({ ...s })),
    notesDry,
    meta: {
      matchedKey: best.spot.key,
      confidence,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    },
  };
}
