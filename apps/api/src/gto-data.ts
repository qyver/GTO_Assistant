/**
 * GTO Data Layer — thin facade keeping the same public API.
 *
 * Phase 2: delegates to the SolverAdapter (PrecomputedAdapter by default).
 * To swap in a real solver, change SOLVER_ADAPTER env var in .env.
 */

import type { GTOSpotQuery, GTORecommendation } from '@pokerbotai/shared';
import { solverAdapter } from './solver-adapter';

export function getSpotRecommendation(query: GTOSpotQuery): GTORecommendation {
  // Adapter is async but matchSpot internally is synchronous for precomputed data.
  // We call it synchronously via a workaround to preserve backward-compatible sync API.
  // For async adapters (ExternalApiAdapter), routes.ts should await adapter.getRecommendation() directly.
  const { matchSpot } = require('./gto-matcher') as typeof import('./gto-matcher');
  return matchSpot(query);
}

export function getAvailableSpots(): string[] {
  return solverAdapter.getAvailableSpots();
}

export { solverAdapter };
