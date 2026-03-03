import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (three levels up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also try the local .env as fallback
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || process.env.API_PORT || '3001', 10),
  host: process.env.API_HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Telegram
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramUpgradeUrl: process.env.TELEGRAM_UPGRADE_URL || 'https://t.me/YourBot',
  localDevBypass: process.env.LOCAL_DEV_BYPASS === 'true',

  // OpenAI API
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  mockClaude: process.env.MOCK_CLAUDE === 'true',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // CORS – comma-separated list of allowed origins in production
  allowedOrigins: process.env.ALLOWED_ORIGINS || '',

  // Public URLs
  publicApiUrl: process.env.PUBLIC_API_URL || '',
  webappUrl: process.env.WEBAPP_URL || '',

  // Rate Limiting
  rateLimitCallsPerDay: parseInt(process.env.RATE_LIMIT_CALLS_PER_DAY || '50', 10),

  // Cache
  cacheTTLHours: 24,
} as const;

export function validateConfig(): void {
  if (!config.localDevBypass && !config.telegramBotToken) {
    console.warn('TELEGRAM_BOT_TOKEN not set. Telegram auth will fail unless LOCAL_DEV_BYPASS=true');
  }

  if (!config.mockClaude && !config.openaiApiKey) {
    console.warn('OPENAI_API_KEY not set. Set MOCK_CLAUDE=true for development without API key');
  }
}
