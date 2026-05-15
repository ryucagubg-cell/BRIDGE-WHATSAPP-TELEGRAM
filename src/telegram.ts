import { Telegraf, Context } from 'telegraf';
import { logError, logInfo } from './logger';
import { handleTelegramMessage, handleConnectCommand, handleDisconnectCommand, handleStatusCommand } from './bridge';

let bot: Telegraf | null = null;
const token = process.env.TELEGRAM_BOT_TOKEN;

export function startTelegram() {
  if (!token) {
    logError('TELEGRAM_BOT_TOKEN is missing in env. Telegram bot will not start.');
    return;
  }

  bot = new Telegraf(token);

  bot.command('start', (ctx) => {
    ctx.reply(
      '🌟 Selamat datang di WhatsApp-Telegram Bridge Bot!\n\n' +
      'Gunakan command berikut:\n' +
      '/connect <nomor_wa> - Hubungkan obrolan ini ke nomor WhatsApp tertentu (contoh: /connect 6281234567890)\n' +
      '/disconnect - Putuskan hubungan obrolan ini dengan WhatsApp\n' +
      '/status - Lihat status koneksi obrolan ini\n\n' +
      '*Baileys adalah library unofficial, resiko blokir/logout ditanggung pengguna.'
    );
  });

  bot.command('connect', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    await handleConnectCommand(ctx, args);
  });

  bot.command('disconnect', async (ctx) => {
    await handleDisconnectCommand(ctx);
  });

  bot.command('status', async (ctx) => {
    await handleStatusCommand(ctx);
  });

  bot.on('message', async (ctx) => {
    // Ignore commands
    if ('text' in ctx.message && ctx.message.text.startsWith('/')) return;
    
    await handleTelegramMessage(ctx);
  });

  bot.launch().then(() => {
    logInfo('Telegram bot successfully started!');
  }).catch(e => {
    logError(`Telegram bot launch failed: ${e}`);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

export function getTelegramBot() {
  return bot;
}

export async function downloadTelegramMedia(ctx: Context, fileId: string): Promise<Buffer | null> {
  try {
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    const response = await fetch(fileUrl.href);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logError(`Failed to download TG media: ${error}`);
    return null;
  }
}

