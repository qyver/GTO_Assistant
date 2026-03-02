import crypto from 'crypto';
import { config } from './config';
import type { TelegramInitData, TelegramUser } from '@pokerbotai/shared';

/**
 * Validate Telegram WebApp initData using HMAC
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): TelegramUser | null {
  // Dev bypass for local testing
  if (config.localDevBypass) {
    console.log('[Telegram Auth] LOCAL_DEV_BYPASS enabled, returning test user');
    return {
      id: 12345678,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    };
  }

  if (!config.telegramBotToken) {
    console.error('[Telegram Auth] TELEGRAM_BOT_TOKEN not configured');
    return null;
  }

  try {
    // Parse init data
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      console.error('[Telegram Auth] Missing hash in initData');
      return null;
    }

    // Remove hash from params
    params.delete('hash');

    // Sort params alphabetically and create data-check-string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.telegramBotToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash
    if (calculatedHash !== hash) {
      console.error('[Telegram Auth] Hash validation failed');
      return null;
    }

    // Check auth_date (should be recent, e.g., within 1 day)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 86400; // 24 hours

    if (now - authDate > maxAge) {
      console.error('[Telegram Auth] initData too old');
      return null;
    }

    // Parse user data
    const userJson = params.get('user');
    if (!userJson) {
      console.error('[Telegram Auth] Missing user in initData');
      return null;
    }

    const user: TelegramUser = JSON.parse(userJson);
    return user;
  } catch (error) {
    console.error('[Telegram Auth] Validation error:', error);
    return null;
  }
}

/**
 * Extract user from request headers
 */
export function extractTelegramUser(authHeader: string | undefined): TelegramUser | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "tma <initData>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'tma') {
    return null;
  }

  const initData = parts[1];
  return validateTelegramInitData(initData);
}
