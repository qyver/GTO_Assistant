/**
 * Telegram Bot — /start command handler + webhook setup.
 * Uses raw Bot API (no external bot libraries).
 */

import { config } from './config';
import { sendTelegramMessage } from './notifications';

const BOT_API = `https://api.telegram.org/bot${config.telegramBotToken}`;

// ─────────────────────────────────────────────────────────────────────────────
// Welcome message
// ─────────────────────────────────────────────────────────────────────────────

function buildWelcomeMessage(firstName: string): { text: string; replyMarkup?: object } {
  const text =
    `<b>Welcome, ${firstName}!</b> \u{1F3B0}\n\n` +
    `I'm your <b>AI Poker Coach</b> \u{2014} powered by GTO solvers and GPT-4.\n\n` +
    `Here's what I can do:\n\n` +
    `\u{1F0CF} <b>GTO Advisor</b> \u{2014} get solver-based recommendations for any spot (position, stack, board)\n\n` +
    `\u{1F4DD} <b>Hand Analysis</b> \u{2014} paste your hand and get AI review with mistakes highlighted\n\n` +
    `\u{1F3AF} <b>Training Drills</b> \u{2014} practice GTO decisions and track your accuracy\n\n` +
    `\u{1F4CA} <b>Equity Calculator</b> \u{2014} run hand vs hand equity simulations\n\n` +
    `\u{1F3C6} <b>Leaderboard</b> \u{2014} compete with other players on drill accuracy\n\n` +
    `Tap the button below to open the app \u{2B07}\u{FE0F}`;

  const miniAppUrl = config.webappUrl;

  const replyMarkup = miniAppUrl
    ? {
        inline_keyboard: [
          [{ text: '\u{1F680} Open Poker Coach', web_app: { url: miniAppUrl } }],
        ],
      }
    : undefined;

  return { text, replyMarkup };
}

// ─────────────────────────────────────────────────────────────────────────────
// Process incoming Telegram update
// ─────────────────────────────────────────────────────────────────────────────

export async function handleTelegramUpdate(update: any): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id.toString();
  const text = message.text.trim();
  const firstName = message.from?.first_name || 'Player';

  if (text === '/start' || text.startsWith('/start ')) {
    const { text: welcomeText, replyMarkup } = buildWelcomeMessage(firstName);
    await sendTelegramMessage(chatId, welcomeText, replyMarkup);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook management
// ─────────────────────────────────────────────────────────────────────────────

export async function setWebhook(publicUrl: string): Promise<boolean> {
  if (!config.telegramBotToken) {
    console.warn('[Bot] No TELEGRAM_BOT_TOKEN, skipping webhook setup');
    return false;
  }

  const webhookUrl = `${publicUrl}/bot/webhook`;

  try {
    const res = await fetch(`${BOT_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    });

    const data = await res.json() as { ok: boolean; description?: string };
    if (data.ok) {
      console.log(`[Bot] Webhook set: ${webhookUrl}`);
    } else {
      console.error(`[Bot] Webhook failed: ${data.description}`);
    }
    return data.ok;
  } catch (err: any) {
    console.error(`[Bot] Webhook error: ${err.message}`);
    return false;
  }
}

export async function deleteWebhook(): Promise<void> {
  try {
    await fetch(`${BOT_API}/deleteWebhook`, { method: 'POST' });
  } catch {
    // ignore
  }
}
