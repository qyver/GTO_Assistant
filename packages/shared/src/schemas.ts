import { z } from 'zod';

// Enums
export const GameFormatSchema = z.enum(['cash', 'tournament']);
export const PositionSchema = z.enum(['BTN', 'CO', 'MP', 'EP', 'SB', 'BB']);
export const ActionSchema = z.enum(['fold', 'check', 'call', 'bet', 'raise', 'all-in']);
export const BoardTextureSchema = z.enum(['dry', 'wet', 'paired', 'monotone', 'rainbow', 'connected']);
export const OpponentArchetypeSchema = z.enum(['nit', 'aggro-reg', 'fish']);
export const SkillLevelSchema = z.enum(['beginner', 'intermediate', 'pro']);
export const DrillTypeSchema = z.enum(['action-choice', 'concept-question', 'spot-recall']);

// GTO Spot Schemas
export const GTOSpotQuerySchema = z.object({
  format: GameFormatSchema,
  stack: z.number().positive(),
  positions: z.object({
    hero: PositionSchema,
    villain: PositionSchema,
  }),
  spotPreset: z.string().optional(),
  board: z.union([z.string(), BoardTextureSchema]).optional(),
  potSize: z.number().positive(),
  effectiveStack: z.number().positive(),
  betSizeSet: z.array(z.number()).optional(),
  rake: z.number().min(0).max(100).optional(),
  ante: z.number().min(0).optional(),
});

export const GTOActionSchema = z.object({
  type: ActionSchema,
  frequency: z.number().min(0).max(100),
  sizes: z.array(z.number()).optional(),
});

export const GTOSizingSchema = z.object({
  size: z.number().positive(),
  frequency: z.number().min(0).max(100),
});

export const GTORecommendationSchema = z.object({
  actions: z.array(GTOActionSchema),
  sizes: z.array(GTOSizingSchema),
  notesDry: z.string(),
  meta: z.object({
    matchedKey: z.string(),
    confidence: z.number().min(0).max(100),
    suggestions: z.array(z.string()).optional(),
  }),
});

// Explain Schemas
export const ExplainRequestSchema = z.object({
  spotContext: GTOSpotQuerySchema,
  gtoOutput: GTORecommendationSchema,
  level: SkillLevelSchema,
  opponentArchetype: OpponentArchetypeSchema.optional(),
});

export const ExplainResponseSchema = z.object({
  shortSummary: z.string(),
  streetPlan: z.string(),
  keyReasons: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  exploitNotes: z.array(z.string()),
  glossary: z.record(z.string()).optional(),
});

// Hand Analysis Schemas
export const ParsedHandSchema = z.object({
  format: GameFormatSchema,
  positions: z.record(z.object({
    stack: z.number(),
    cards: z.string().optional(),
  })),
  actions: z.array(z.object({
    street: z.enum(['preflop', 'flop', 'turn', 'river']),
    position: PositionSchema,
    action: ActionSchema,
    amount: z.number().optional(),
  })),
  board: z.object({
    flop: z.string().optional(),
    turn: z.string().optional(),
    river: z.string().optional(),
  }),
  pot: z.number(),
});

export const HandAnalysisRequestSchema = z.object({
  rawText: z.string().max(5000),
  parsedHand: ParsedHandSchema.partial().optional(),
  userProfile: z.any().optional(),
});

export const StreetAnalysisSchema = z.object({
  recommended: z.array(z.string()),  // GPT may return "3bet", "check-raise", etc.
  rationale: z.string(),
});

export const HandAnalysisResponseSchema = z.object({
  handSummary: z.string(),
  streetByStreet: z.object({
    preflop: StreetAnalysisSchema.optional(),
    flop: StreetAnalysisSchema.optional(),
    turn: StreetAnalysisSchema.optional(),
    river: StreetAnalysisSchema.optional(),
  }),
  takeaways: z.array(z.string()).min(1).max(3),
  nextDrillSuggestion: z.string(),
});

// Training Schemas
export const UserProfileSchema = z.object({
  telegramId: z.string(),
  skillLevel: SkillLevelSchema,
  formatPreference: z.union([GameFormatSchema, z.literal('both')]),
  typicalStakes: z.string(),
  mainGoal: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DrillSchema = z.object({
  id: z.string(),
  type: DrillTypeSchema,
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correct: z.number().int().min(0),
  explanation: z.string(),
  spotRef: z.string().optional(),
});

export const TrainingGenerationRequestSchema = z.object({
  userProfile: UserProfileSchema,
  availableSpots: z.array(z.string()),
  difficulty: SkillLevelSchema,
  count: z.number().int().min(1).max(20).optional(),
});

export const TrainingGenerationResponseSchema = z.object({
  drills: z.array(DrillSchema).min(1).max(20),
});

// API Response Schema
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// Telegram Schemas
export const TelegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

export const TelegramInitDataSchema = z.object({
  query_id: z.string().optional(),
  user: TelegramUserSchema.optional(),
  auth_date: z.number(),
  hash: z.string(),
});
