import type { FastifyInstance } from 'fastify';
import { extractTelegramUser } from './telegram-auth';
import { prisma } from './db';
import { explainGTO, reviewHand, generateTraining } from './claude';
import { getSpotRecommendation, getAvailableSpots } from './gto-data';
import { analyzeBoard } from './board-analyzer';
import { config } from './config';
import { logEvent, logError } from './analytics';
import { parseHandHistory } from './hand-parser';
import { calculateEquity } from './equity-calc';
import { sendTelegramMessage, buildDrillReminderMessage } from './notifications';
import { handleTelegramUpdate } from './bot';
import {
  GTOSpotQuerySchema,
  ExplainRequestSchema,
  HandAnalysisRequestSchema,
  UserProfileSchema,
  TrainingGenerationRequestSchema,
} from '@pokerbotai/shared';
import type { UserProfile } from '@pokerbotai/shared';

/**
 * Authentication middleware
 */
async function authenticate(request: any, reply: any) {
  const authHeader = request.headers.authorization;
  const user = extractTelegramUser(authHeader);

  if (!user) {
    reply.code(401).send({ success: false, error: 'Unauthorized' });
    return;
  }

  request.user = user;
}

/**
 * Admin middleware — checks X-Admin-Key header
 */
async function adminOnly(request: any, reply: any) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    reply.code(403).send({ success: false, error: 'Admin access not configured' });
    return;
  }
  if (request.headers['x-admin-key'] !== adminKey) {
    reply.code(403).send({ success: false, error: 'Forbidden' });
    return;
  }
}

/**
 * Register all API routes
 */
export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Config endpoint (public info only)
  fastify.get('/config', async () => {
    return {
      upgradeUrl: config.telegramUpgradeUrl,
      mockMode: config.mockClaude,
    };
  });

  // GTO Spot recommendation
  fastify.post('/gto/spot', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      const t0 = Date.now();
      const telegramId = request.user.id.toString();
      try {
        const query = GTOSpotQuerySchema.parse(request.body);
        const recommendation = getSpotRecommendation(query);

        logEvent({
          telegramId,
          event: 'gto_spot',
          module: 'gto',
          durationMs: Date.now() - t0,
          metadata: { confidence: recommendation.meta.confidence, matchedKey: recommendation.meta.matchedKey },
        });

        return { success: true, data: recommendation };
      } catch (error: any) {
        logError('gto_spot', error, telegramId);
        reply.code(400).send({ success: false, error: error.message || 'Invalid request' });
      }
    },
  });

  // GTO Explain (AI)
  fastify.post('/gto/explain', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      const t0 = Date.now();
      const telegramId = request.user.id.toString();
      try {
        const explainReq = ExplainRequestSchema.parse(request.body);

        let userProfile = await prisma.userProfile.findUnique({ where: { telegramId } });
        if (!userProfile) {
          userProfile = await prisma.userProfile.create({
            data: { telegramId, skillLevel: explainReq.level, formatPreference: 'both', typicalStakes: 'unknown', mainGoal: 'improve' },
          });
        }

        const explanation = await explainGTO(userProfile.id, telegramId, explainReq);

        logEvent({ telegramId, event: 'gto_explain', module: 'gto', durationMs: Date.now() - t0 });
        return { success: true, data: explanation };
      } catch (error: any) {
        logError('gto_explain', error, telegramId);
        reply.code(error.message.includes('Rate limit') ? 429 : 400).send({
          success: false, error: error.message || 'Failed to generate explanation',
        });
      }
    },
  });

  // Hand Analysis (AI)
  fastify.post('/hand/analyze', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      const t0 = Date.now();
      const telegramId = request.user.id.toString();
      try {
        const analysisReq = HandAnalysisRequestSchema.parse(request.body);

        let userProfile = await prisma.userProfile.findUnique({ where: { telegramId } });
        if (!userProfile) {
          userProfile = await prisma.userProfile.create({
            data: { telegramId, skillLevel: 'intermediate', formatPreference: 'both', typicalStakes: 'unknown', mainGoal: 'improve' },
          });
        }

        const analysis = await reviewHand(userProfile.id, telegramId, analysisReq);

        logEvent({ telegramId, event: 'hand_analyze', module: 'hand', durationMs: Date.now() - t0 });
        return { success: true, data: analysis };
      } catch (error: any) {
        logError('hand_analyze', error, telegramId);
        reply.code(error.message.includes('Rate limit') ? 429 : 400).send({
          success: false, error: error.message || 'Failed to analyze hand',
        });
      }
    },
  });

  // User Profile - Get
  fastify.get('/user/profile', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const profile = await prisma.userProfile.findUnique({ where: { telegramId } });

        if (!profile) {
          reply.code(404).send({ success: false, error: 'Profile not found' });
          return;
        }

        return { success: true, data: profile };
      } catch (error: any) {
        console.error('[API] /user/profile GET error:', error);
        reply.code(500).send({ success: false, error: 'Failed to fetch profile' });
      }
    },
  });

  // User Profile - Create/Update
  fastify.post('/user/profile', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const data = request.body as Partial<UserProfile>;

        if (!data.skillLevel || !data.formatPreference || !data.mainGoal) {
          reply.code(400).send({ success: false, error: 'Missing required fields: skillLevel, formatPreference, mainGoal' });
          return;
        }

        const profile = await prisma.userProfile.upsert({
          where: { telegramId },
          update: {
            skillLevel: data.skillLevel,
            formatPreference: data.formatPreference,
            typicalStakes: data.typicalStakes || 'unknown',
            mainGoal: data.mainGoal,
          },
          create: {
            telegramId,
            skillLevel: data.skillLevel,
            formatPreference: data.formatPreference,
            typicalStakes: data.typicalStakes || 'unknown',
            mainGoal: data.mainGoal,
          },
        });

        return { success: true, data: profile };
      } catch (error: any) {
        console.error('[API] /user/profile POST error:', error);
        reply.code(500).send({ success: false, error: 'Failed to save profile' });
      }
    },
  });

  // User Stats — authenticated user's own usage + costs
  fastify.get('/user/stats', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const today = new Date().toISOString().split('T')[0];

        const profile = await prisma.userProfile.findUnique({ where: { telegramId } });
        const todayRateLimit = profile
          ? await prisma.rateLimit.findUnique({ where: { userId_date: { userId: profile.id, date: today } } })
          : null;
        const aiCallsToday = todayRateLimit?.callCount ?? 0;

        const allTimeUsage = await prisma.apiUsage.findMany({
          where: { telegramId },
          select: { promptType: true, costUsd: true, cached: true },
        });

        const eventCounts = await prisma.analyticsEvent.groupBy({
          by: ['event'],
          where: { telegramId },
          _count: { event: true },
        });

        const perfData = await prisma.analyticsEvent.aggregate({
          where: { telegramId, durationMs: { not: null } },
          _avg: { durationMs: true },
        });

        const totalCostUsd = allTimeUsage.reduce((sum, u) => sum + u.costUsd, 0);
        const cacheHits = allTimeUsage.filter((u) => u.cached).length;
        const moduleUsage = eventCounts.reduce((acc, e) => {
          acc[e.event] = e._count.event;
          return acc;
        }, {} as Record<string, number>);

        return {
          success: true,
          data: {
            today: {
              aiCalls: aiCallsToday,
              remaining: Math.max(0, config.rateLimitCallsPerDay - aiCallsToday),
            },
            allTime: {
              totalAiCalls: allTimeUsage.length,
              totalCostUsd: parseFloat(totalCostUsd.toFixed(6)),
              cacheHits,
              moduleUsage,
              avgResponseMs: perfData._avg.durationMs ? Math.round(perfData._avg.durationMs) : null,
            },
          },
        };
      } catch (error: any) {
        console.error('[API] /user/stats error:', error);
        reply.code(500).send({ success: false, error: 'Failed to fetch stats' });
      }
    },
  });

  // Training - Generate Drills (AI)
  fastify.post('/training/generate', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      const t0 = Date.now();
      const telegramId = request.user.id.toString();
      try {
        const userProfile = await prisma.userProfile.findUnique({ where: { telegramId } });

        if (!userProfile) {
          reply.code(400).send({ success: false, error: 'Please complete your profile first' });
          return;
        }

        const { difficulty, count } = request.body as { difficulty?: string; count?: number };

        const trainingReq: any = {
          userProfile: {
            telegramId: userProfile.telegramId,
            skillLevel: userProfile.skillLevel,
            formatPreference: userProfile.formatPreference,
            typicalStakes: userProfile.typicalStakes,
            mainGoal: userProfile.mainGoal,
            createdAt: userProfile.createdAt,
            updatedAt: userProfile.updatedAt,
          },
          availableSpots: getAvailableSpots(),
          difficulty: difficulty || userProfile.skillLevel,
          count: count || 5,
        };

        const training = await generateTraining(userProfile.id, telegramId, trainingReq);

        logEvent({ telegramId, event: 'training_generate', module: 'training', durationMs: Date.now() - t0 });
        return { success: true, data: training };
      } catch (error: any) {
        logError('training_generate', error, telegramId);
        reply.code(error.message.includes('Rate limit') ? 429 : 400).send({
          success: false, error: error.message || 'Failed to generate training',
        });
      }
    },
  });

  // Spot Presets
  fastify.get('/spots/presets', async () => {
    return {
      success: true,
      data: {
        cash: ['BTN vs BB SRP', 'SB vs BB SRP', 'CO vs BTN SRP', 'CO vs BB SRP', 'MP vs BB SRP', 'BTN vs BB 3bet', 'SB vs BTN 3bet', 'BTN vs CO 3bet'],
        tournament: ['BTN vs BB SRP 20bb', 'SB vs BB SRP 20bb', 'BTN vs BB SRP 25bb', 'BTN vs BB SRP 30bb', 'SB vs BB SRP 30bb', 'BTN vs BB SRP 40bb', 'BTN vs BB SRP 60bb', 'BTN vs BB SRP 80bb'],
      },
    };
  });

  // Board Info
  fastify.get('/gto/board-info', async (request, reply) => {
    const { board } = request.query as { board?: string };

    if (!board) {
      return reply.code(400).send({ success: false, error: 'board query param required (e.g. ?board=Ks7d2c)' });
    }

    const analysis = analyzeBoard(board);

    if (!analysis) {
      return reply.code(422).send({ success: false, error: 'Could not parse board. Use format like "Ks7d2c" or "Ks 7d 2c".' });
    }

    logEvent({ event: 'board_info', module: 'gto', metadata: { board, category: analysis.category } });
    return { success: true, data: analysis };
  });

  // Solver info
  fastify.get('/solver/info', async () => {
    const { solverAdapter } = await import('./gto-data');
    const available = await solverAdapter.isAvailable();
    return {
      success: true,
      data: { adapter: solverAdapter.name, available, totalSpots: solverAdapter.getAvailableSpots().length },
    };
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Admin endpoints — protected by X-Admin-Key header
  // Set ADMIN_KEY env var to enable
  // ─────────────────────────────────────────────────────────────────────────────

  fastify.get('/admin/stats', {
    preHandler: adminOnly,
    handler: async (_request, reply) => {
      try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const week7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
          totalUsers,
          activeUsers7d,
          aiCallsToday,
          aiCallsWeek,
          costData,
          eventCounts,
          errorCount,
          recentErrors,
          perfData,
        ] = await Promise.all([
          prisma.userProfile.count(),
          prisma.analyticsEvent
            .groupBy({ by: ['telegramId'], where: { createdAt: { gte: week7dAgo }, telegramId: { not: null } }, _count: true })
            .then((r) => r.length),
          prisma.rateLimit.aggregate({ where: { date: today }, _sum: { callCount: true } }),
          prisma.apiUsage.count({ where: { createdAt: { gte: week7dAgo }, cached: false } }),
          prisma.apiUsage.aggregate({ _sum: { costUsd: true } }),
          prisma.analyticsEvent.groupBy({ by: ['event'], _count: { event: true } }),
          prisma.analyticsEvent.count({ where: { isError: true } }),
          prisma.analyticsEvent.findMany({
            where: { isError: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { event: true, errorMsg: true, telegramId: true, createdAt: true },
          }),
          prisma.analyticsEvent.aggregate({
            where: { durationMs: { not: null } },
            _avg: { durationMs: true },
          }),
        ]);

        const events = eventCounts.reduce((acc, e) => {
          acc[e.event] = e._count.event;
          return acc;
        }, {} as Record<string, number>);

        return {
          success: true,
          data: {
            users: { total: totalUsers, active7d: activeUsers7d },
            aiCalls: {
              today: aiCallsToday._sum.callCount ?? 0,
              week: aiCallsWeek,
              totalCostUsd: parseFloat((costData._sum.costUsd ?? 0).toFixed(4)),
            },
            events,
            errors: { total: errorCount, recent: recentErrors },
            performance: { avgResponseMs: perfData._avg.durationMs ? Math.round(perfData._avg.durationMs) : null },
          },
        };
      } catch (error: any) {
        console.error('[API] /admin/stats error:', error);
        reply.code(500).send({ success: false, error: 'Failed to fetch admin stats' });
      }
    },
  });

  // Admin: per-user ChatGPT cost breakdown (top 50 by cost)
  fastify.get('/admin/costs', {
    preHandler: adminOnly,
    handler: async (_request, reply) => {
      try {
        const perUser = await prisma.apiUsage.groupBy({
          by: ['telegramId', 'model'],
          _sum: { costUsd: true, inputTokens: true, outputTokens: true },
          _count: { id: true },
          orderBy: { _sum: { costUsd: 'desc' } },
          take: 50,
        });

        return {
          success: true,
          data: perUser.map((row) => ({
            telegramId: row.telegramId,
            model: row.model,
            calls: row._count.id,
            inputTokens: row._sum.inputTokens ?? 0,
            outputTokens: row._sum.outputTokens ?? 0,
            costUsd: parseFloat((row._sum.costUsd ?? 0).toFixed(6)),
          })),
        };
      } catch (error: any) {
        console.error('[API] /admin/costs error:', error);
        reply.code(500).send({ success: false, error: 'Failed to fetch costs' });
      }
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 5: Advanced Features
  // ─────────────────────────────────────────────────────────────────────────────

  // Hand History Parser — extract structured data from raw hand text
  fastify.post('/hand/parse', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const { text } = request.body as { text: string };
        if (!text || text.length < 10) {
          return reply.code(400).send({ success: false, error: 'text is required' });
        }
        const parsed = parseHandHistory(text);
        return { success: true, data: parsed };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to parse hand' });
      }
    },
  });

  // Equity Calculator — Monte Carlo hand vs hand
  fastify.post('/equity/calculate', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const { heroHand, villainHand, board, iterations } = request.body as {
          heroHand: string;
          villainHand: string;
          board?: string;
          iterations?: number;
        };
        if (!heroHand || !villainHand) {
          return reply.code(400).send({ success: false, error: 'heroHand and villainHand required' });
        }
        const n = Math.min(iterations || 5000, 20000);
        const result = calculateEquity(heroHand, villainHand, board, n);
        if ('error' in result) {
          return reply.code(400).send({ success: false, error: result.error });
        }
        logEvent({ telegramId: request.user.id.toString(), event: 'equity_calc', module: 'gto' });
        return { success: true, data: result };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Equity calculation failed' });
      }
    },
  });

  // Session History — recent activity per user (last 20 entries)
  fastify.get('/user/history', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const history = await prisma.sessionHistory.findMany({
          where: { telegramId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, type: true, title: true, shareCode: true, createdAt: true },
        });
        return { success: true, data: history };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to fetch history' });
      }
    },
  });

  // Session History — save an entry (called internally by other routes after success)
  fastify.post('/user/history', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const { type, title, data, share } = request.body as {
          type: string; title: string; data: any; share?: boolean;
        };

        const shareCode = share ? require('crypto').randomBytes(6).toString('hex') : undefined;

        const entry = await prisma.sessionHistory.create({
          data: { telegramId, type, title, shareCode, data: JSON.stringify(data) },
        });

        // Keep max 20 entries per user — delete oldest if over
        const count = await prisma.sessionHistory.count({ where: { telegramId } });
        if (count > 20) {
          const oldest = await prisma.sessionHistory.findMany({
            where: { telegramId },
            orderBy: { createdAt: 'asc' },
            take: count - 20,
            select: { id: true },
          });
          await prisma.sessionHistory.deleteMany({ where: { id: { in: oldest.map((e) => e.id) } } });
        }

        return { success: true, data: { id: entry.id, shareCode: entry.shareCode } };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to save history' });
      }
    },
  });

  // Public share link — view a shared hand analysis
  fastify.get('/share/:code', async (request: any, reply) => {
    try {
      const { code } = request.params as { code: string };
      const entry = await prisma.sessionHistory.findUnique({
        where: { shareCode: code },
        select: { type: true, title: true, data: true, createdAt: true },
      });
      if (!entry) return reply.code(404).send({ success: false, error: 'Share not found' });
      return {
        success: true,
        data: { type: entry.type, title: entry.title, result: JSON.parse(entry.data), createdAt: entry.createdAt },
      };
    } catch (error: any) {
      reply.code(500).send({ success: false, error: 'Failed to fetch share' });
    }
  });

  // Training Score — submit session results for leaderboard
  fastify.post('/training/score', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const { correct, total, displayName } = request.body as {
          correct: number; total: number; displayName?: string;
        };

        if (total <= 0 || correct < 0 || correct > total) {
          return reply.code(400).send({ success: false, error: 'Invalid score values' });
        }

        // Get user's display name from Telegram user data or provided name
        const name = displayName || `User_${telegramId.slice(-4)}`;

        const updated = await prisma.trainingScore.upsert({
          where: { telegramId },
          update: {
            totalDrills: { increment: total },
            correctDrills: { increment: correct },
            displayName: name,
            lastActive: new Date(),
          },
          create: {
            telegramId,
            displayName: name,
            totalDrills: total,
            correctDrills: correct,
          },
        });

        return {
          success: true,
          data: {
            totalDrills: updated.totalDrills,
            correctDrills: updated.correctDrills,
            accuracy: updated.totalDrills > 0
              ? parseFloat(((updated.correctDrills / updated.totalDrills) * 100).toFixed(1))
              : 0,
          },
        };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to save score' });
      }
    },
  });

  // Leaderboard — top 10 players by accuracy (min 5 drills)
  fastify.get('/leaderboard', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();

        const scores = await prisma.trainingScore.findMany({
          where: { totalDrills: { gte: 5 } },
          orderBy: [{ correctDrills: 'desc' }, { totalDrills: 'desc' }],
          take: 10,
        });

        const leaderboard = scores.map((s, i) => ({
          rank: i + 1,
          displayName: s.displayName,
          totalDrills: s.totalDrills,
          correctDrills: s.correctDrills,
          accuracy: parseFloat(((s.correctDrills / s.totalDrills) * 100).toFixed(1)),
          isMe: s.telegramId === telegramId,
          lastActive: s.lastActive,
        }));

        // Find current user's rank if not in top 10
        const myScore = await prisma.trainingScore.findUnique({ where: { telegramId } });
        const myRankData = myScore
          ? {
              rank: (await prisma.trainingScore.count({ where: { correctDrills: { gt: myScore.correctDrills }, totalDrills: { gte: 5 } } })) + 1,
              totalDrills: myScore.totalDrills,
              correctDrills: myScore.correctDrills,
              accuracy: myScore.totalDrills > 0 ? parseFloat(((myScore.correctDrills / myScore.totalDrills) * 100).toFixed(1)) : 0,
            }
          : null;

        return { success: true, data: { leaderboard, myRank: myRankData } };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to fetch leaderboard' });
      }
    },
  });

  // Notifications — opt in/out of daily drill reminders
  fastify.post('/user/notifications', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const { enabled, chatId } = request.body as { enabled: boolean; chatId?: string };

        const id = chatId || telegramId; // Use provided chatId or fallback to telegramId

        const pref = await prisma.notificationPref.upsert({
          where: { telegramId },
          update: { enabled, chatId: id, updatedAt: new Date() },
          create: { telegramId, chatId: id, enabled },
        });

        // Send welcome message if opting in
        if (enabled) {
          const { text, replyMarkup } = buildDrillReminderMessage();
          await sendTelegramMessage(id, `✅ Notifications enabled!\n\nYou'll receive daily drill reminders.\n\n${text}`, replyMarkup);
        }

        return { success: true, data: { enabled: pref.enabled } };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to update notification preference' });
      }
    },
  });

  // Notifications — get current preference
  fastify.get('/user/notifications', {
    preHandler: authenticate,
    handler: async (request: any, reply) => {
      try {
        const telegramId = request.user.id.toString();
        const pref = await prisma.notificationPref.findUnique({ where: { telegramId } });
        return { success: true, data: { enabled: pref?.enabled ?? false } };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to fetch notification preference' });
      }
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Telegram Bot Webhook — handles /start and other bot commands
  // ─────────────────────────────────────────────────────────────────────────────
  fastify.post('/bot/webhook', async (request, reply) => {
    try {
      await handleTelegramUpdate(request.body);
    } catch (err) {
      console.error('[Bot] Webhook handler error:', err);
    }
    // Telegram expects 200 OK regardless of processing result
    return { ok: true };
  });

  // Notifications — send daily drill to all opted-in users (admin-protected)
  fastify.post('/admin/notifications/send-daily', {
    preHandler: adminOnly,
    handler: async (_request, reply) => {
      try {
        const prefs = await prisma.notificationPref.findMany({
          where: { enabled: true },
        });

        let sent = 0, failed = 0;
        const { text, replyMarkup } = buildDrillReminderMessage(process.env.MINI_APP_URL);

        for (const pref of prefs) {
          const result = await sendTelegramMessage(pref.chatId, text, replyMarkup);
          if (result.ok) {
            sent++;
            await prisma.notificationPref.update({ where: { id: pref.id }, data: { lastSent: new Date() } });
          } else {
            failed++;
            console.warn(`[Notifications] Failed to send to ${pref.telegramId}: ${result.error}`);
          }
        }

        return { success: true, data: { sent, failed, total: prefs.length } };
      } catch (error: any) {
        reply.code(500).send({ success: false, error: 'Failed to send notifications' });
      }
    },
  });
}
