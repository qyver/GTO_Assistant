/**
 * Analytics — lightweight self-hosted event + error tracking.
 *
 * Stores events in SQLite (AnalyticsEvent table).
 * Non-blocking: all writes are fire-and-forget with catch.
 */

import { prisma } from './db';

export interface EventPayload {
  telegramId?: string;
  event: string;
  module?: string;
  durationMs?: number;
  isError?: boolean;
  errorMsg?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an analytics event. Fire-and-forget — never throws.
 */
export function logEvent(payload: EventPayload): void {
  prisma.analyticsEvent
    .create({
      data: {
        telegramId: payload.telegramId,
        event: payload.event,
        module: payload.module,
        durationMs: payload.durationMs,
        isError: payload.isError ?? false,
        errorMsg: payload.errorMsg,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      },
    })
    .catch((err) => {
      console.error('[Analytics] Failed to log event:', err);
    });
}

/**
 * Log a structured error event.
 */
export function logError(
  event: string,
  error: Error | string,
  telegramId?: string,
  metadata?: Record<string, unknown>
): void {
  const msg = typeof error === 'string' ? error : error.message;
  logEvent({ telegramId, event, isError: true, errorMsg: msg.slice(0, 500), metadata });
  console.error(`[Error][${event}] ${msg}`, metadata || '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost calculation for ChatGPT models
// ─────────────────────────────────────────────────────────────────────────────

// Prices in USD per 1M tokens
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4.1-mini':    { input: 0.40,  output: 1.60  },
  'gpt-4o-mini':     { input: 0.15,  output: 0.60  },
  'gpt-4o':          { input: 2.50,  output: 10.00 },
  'gpt-4.1':         { input: 2.00,  output: 8.00  },
  'gpt-4-turbo':     { input: 10.00, output: 30.00 },
  'o3-mini':         { input: 1.10,  output: 4.40  },
};

export function calcCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MODEL_COSTS[model] ?? { input: 2.00, output: 8.00 };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

/**
 * Record ChatGPT API usage + cost. Fire-and-forget — never throws.
 */
export function recordApiUsage(params: {
  userId: string;
  telegramId: string;
  promptType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cached?: boolean;
}): void {
  const costUsd = calcCostUsd(params.model, params.inputTokens, params.outputTokens);

  prisma.apiUsage
    .create({
      data: {
        userId: params.userId,
        telegramId: params.telegramId,
        promptType: params.promptType,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd,
        cached: params.cached ?? false,
      },
    })
    .catch((err) => {
      console.error('[Analytics] Failed to record API usage:', err);
    });
}
