/**
 * SolverAdapter — Abstract interface for GTO solver backends.
 *
 * Current implementation: PrecomputedAdapter (JSON files)
 * Future: PioSolverAdapter, GtoPlusAdapter, ExternalApiAdapter
 *
 * Swap via env: SOLVER_ADAPTER=precomputed (default) | external
 */

import type { GTOSpotQuery, GTORecommendation } from '@pokerbotai/shared';

export interface SolverAdapter {
  readonly name: string;
  getRecommendation(query: GTOSpotQuery): Promise<GTORecommendation>;
  getAvailableSpots(): string[];
  isAvailable(): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Precomputed Adapter (current default)
// ─────────────────────────────────────────────────────────────────────────────

import { matchSpot, getAllSpotKeys } from './gto-matcher';

export class PrecomputedAdapter implements SolverAdapter {
  readonly name = 'precomputed';

  async getRecommendation(query: GTOSpotQuery): Promise<GTORecommendation> {
    return matchSpot(query);
  }

  getAvailableSpots(): string[] {
    return getAllSpotKeys();
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// External API Adapter (stub for future integration)
// ─────────────────────────────────────────────────────────────────────────────

export class ExternalApiAdapter implements SolverAdapter {
  readonly name = 'external-api';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fallback: PrecomputedAdapter;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.fallback = new PrecomputedAdapter();
  }

  async getRecommendation(query: GTOSpotQuery): Promise<GTORecommendation> {
    try {
      const res = await fetch(`${this.baseUrl}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!res.ok) throw new Error(`Solver API error: ${res.status}`);

      const data = await res.json();
      return data as GTORecommendation;
    } catch (error) {
      console.warn('[Solver] External API failed, falling back to precomputed:', error);
      return this.fallback.getRecommendation(query);
    }
  }

  getAvailableSpots(): string[] {
    return this.fallback.getAvailableSpots();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: create active adapter from env config
// ─────────────────────────────────────────────────────────────────────────────

export function createSolverAdapter(): SolverAdapter {
  const adapterName = process.env.SOLVER_ADAPTER || 'precomputed';

  switch (adapterName) {
    case 'external': {
      const url = process.env.SOLVER_API_URL;
      const key = process.env.SOLVER_API_KEY || '';
      if (!url) {
        console.warn('[Solver] SOLVER_API_URL not set, falling back to precomputed');
        return new PrecomputedAdapter();
      }
      console.log(`[Solver] Using ExternalApiAdapter → ${url}`);
      return new ExternalApiAdapter(url, key);
    }

    case 'precomputed':
    default:
      console.log('[Solver] Using PrecomputedAdapter (300+ spots)');
      return new PrecomputedAdapter();
  }
}

// Singleton adapter instance
export const solverAdapter = createSolverAdapter();
