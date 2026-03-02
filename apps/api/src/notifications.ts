/**
 * Push Notifications — Telegram Bot API integration.
 * Sends daily drill reminders to opted-in users.
 */

import { config } from './config';

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

/**
 * Send a Telegram message to a specific chat.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: object
): Promise<{ ok: boolean; error?: string }> {
  if (!config.telegramBotToken) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const res = await fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      }
    );

    const data = await res.json() as TelegramResponse;
    if (!data.ok) return { ok: false, error: data.description };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Build a daily drill reminder message.
 */
export function buildDrillReminderMessage(miniAppUrl?: string): {
  text: string;
  replyMarkup?: object;
} {
  const text =
    `🧠 <b>Daily Poker Drill Reminder</b>\n\n` +
    `Time to sharpen your GTO game! Your daily training drills are ready.\n\n` +
    `🎯 Practice spots\n💡 Learn concepts\n📈 Track your progress`;

  const replyMarkup = miniAppUrl
    ? {
        inline_keyboard: [
          [{ text: '💪 Start Training', web_app: { url: miniAppUrl } }],
        ],
      }
    : undefined;

  return { text, replyMarkup };
}
