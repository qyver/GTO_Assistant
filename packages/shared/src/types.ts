// Core Types
export type GameFormat = 'cash' | 'tournament';
export type Position = 'BTN' | 'CO' | 'MP' | 'EP' | 'SB' | 'BB';
export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
export type BoardTexture = 'dry' | 'wet' | 'paired' | 'monotone' | 'rainbow' | 'connected';
export type OpponentArchetype = 'nit' | 'aggro-reg' | 'fish';
export type SkillLevel = 'beginner' | 'intermediate' | 'pro';
export type DrillType = 'action-choice' | 'concept-question' | 'spot-recall';

// GTO Spot Types
export interface GTOSpotQuery {
  format: GameFormat;
  stack: number; // in bb
  positions: {
    hero: Position;
    villain: Position;
  };
  spotPreset?: string; // e.g., 'BTN vs BB SRP'
  board?: string | BoardTexture; // exact cards or texture
  potSize: number;
  effectiveStack: number;
  betSizeSet?: number[]; // optional
  rake?: number;
  ante?: number;
}

export interface GTOAction {
  type: Action;
  frequency: number; // 0-100
  sizes?: number[]; // bet/raise sizes as % of pot
}

export interface GTOSizing {
  size: number; // % of pot
  frequency: number; // 0-100
}

export interface GTORecommendation {
  actions: GTOAction[];
  sizes: GTOSizing[];
  notesDry: string;
  meta: {
    matchedKey: string;
    confidence: number; // 0-100
    suggestions?: string[];
  };
}

// Claude Explanation Types
export interface ExplainRequest {
  spotContext: GTOSpotQuery;
  gtoOutput: GTORecommendation;
  level: SkillLevel;
  opponentArchetype?: OpponentArchetype;
}

export interface ExplainResponse {
  shortSummary: string;
  streetPlan: string;
  keyReasons: string[];
  commonMistakes: string[];
  exploitNotes: string[];
  glossary?: Record<string, string>;
}

// Hand Analysis Types
export interface ParsedHand {
  format: GameFormat;
  positions: Record<string, { stack: number; cards?: string }>;
  actions: {
    street: 'preflop' | 'flop' | 'turn' | 'river';
    position: Position;
    action: Action;
    amount?: number;
  }[];
  board: {
    flop?: string;
    turn?: string;
    river?: string;
  };
  pot: number;
}

export interface HandAnalysisRequest {
  rawText: string;
  parsedHand?: Partial<ParsedHand>;
  userProfile?: UserProfile;
}

export interface StreetAnalysis {
  recommended: Action[];
  rationale: string;
}

export interface HandAnalysisResponse {
  handSummary: string;
  streetByStreet: {
    preflop?: StreetAnalysis;
    flop?: StreetAnalysis;
    turn?: StreetAnalysis;
    river?: StreetAnalysis;
  };
  takeaways: string[];
  nextDrillSuggestion: string;
}

// Training Types
export interface UserProfile {
  telegramId: string;
  skillLevel: SkillLevel;
  formatPreference: GameFormat | 'both';
  typicalStakes: string;
  mainGoal: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Drill {
  id: string;
  type: DrillType;
  prompt: string;
  options: string[];
  correct: number; // index
  explanation: string;
  spotRef?: string;
}

export interface TrainingGenerationRequest {
  userProfile: UserProfile;
  availableSpots: string[];
  difficulty: SkillLevel;
  count?: number; // default 5-10
}

export interface TrainingGenerationResponse {
  drills: Drill[];
}

export interface TrainingProgress {
  drillId: string;
  userAnswer: number;
  correct: boolean;
  timestamp: Date;
}

export interface TrainingSession {
  score: number;
  total: number;
  suggestedTopics: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Telegram Types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}
