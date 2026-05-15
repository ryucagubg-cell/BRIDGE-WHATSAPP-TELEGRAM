import { getWhatsAppByTelegram, getTelegramByWhatsApp, setMapping, removeMapping } from './storage';
import { getWhatsAppSocket, downloadWAMedia, startWhatsApp } from './whatsapp';
import { getTelegramBot, downloadTelegramMedia, startTelegram } from './telegram';
import { logError, logMessage, logInfo } from './logger';
import type { WAMessage, AnyMessageContent } from '@whiskeysockets/baileys';
import { Context } from 'telegraf';

// Helper to format phone number to JID
function formatToJid(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1); // Default to Indonesian prefix if starts with 0
  }
  if (!cleaned.endsWith('@s.whatsapp.net')) {
    cleaned = cleaned + '@s.whatsapp.net';
  }
  return cleaned;
}

export async function startBridge() {
  logInfo('Starting Bridge...');
  startWhatsApp();
  startTelegram();
}

export async function handleConnectCommand(ctx: Context, args: string[]) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (args.length === 0) {
    return ctx.reply('Format salah. Gunakan: /connect <nomor_wa>\nContoh: /connect 6281234567890');
  }

  const phone = args[0];
  const jid = formatToJid(phone);

  setMapping(chatId, jid);
  ctx.reply(`✅ Berhasil. Obrolan ini sekarang terhubung dengan WhatsApp (JID: ${jid})`);
  logMessage('TG->WA', `Connected Chat ${chatId} to JID ${jid}`);
}

export async function handleDisconnectCommand(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  removeMapping(chatId);
  ctx.reply('❌ Koneksi WhatsApp telah diputuskan untuk obrolan ini.');
  logMessage('TG->WA', `Disconnected Chat ${chatId}`);
}

export async function handleStatusCommand(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const mappedJid = getWhatsAppByTelegram(chatId);
  if (mappedJid) {
    ctx.reply(`🔗 Obrolan ini terhubung ke JID: ${mappedJid}`);
  } else {
    ctx.reply('⚠️ Obrolan ini belum terhubung ke nomor WhatsApp mana pun.');
  }
}

export async function handleTelegramMessage(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const targetJid = getWhatsAppByTelegram(chatId);
  if (!targetJid) {
    // If not connected, perhaps remind them, but doing so on every message can be annoying.
    // We'll just ignore or send a single warning (better ignored if we want a clean group).
    return;
  }

  const sock = getWhatsAppSocket();
  if (!sock) {
    return ctx.reply('⚠️ Sistem WhatsApp sedang tidak aktif. Coba lagi nanti.');
  }

  try {
    const msg = ctx.message;
    let waPayload: AnyMessageContent | null = null;
    let caption = '';
    
    let replyPrefix = '';
    if (msg && 'reply_to_message' in msg && msg.reply_to_message) {
      replyPrefix = '> [Membalas pesan Telegram]\n';
    }

    if (msg && 'caption' in msg && msg.caption) {
      caption = replyPrefix + msg.caption;
    } else if (replyPrefix) {
      caption = replyPrefix;
    }

    if (msg && 'text' in msg) {
      waPayload = { text: replyPrefix + msg.text };
    } 
    else if (msg && 'photo' in msg) {
      const photos = msg.photo;
      const fileId = photos[photos.length - 1].file_id; // Get highest resolution
      const buffer = await downloadTelegramMedia(ctx, fileId);
      if (buffer) {
        waPayload = { image: buffer, caption };
      }
    } 
    else if (msg && 'video' in msg) {
      const fileId = msg.video.file_id;
      const buffer = await downloadTelegramMedia(ctx, fileId);
      if (buffer) {
        waPayload = { video: buffer, caption };
      }
    } 
    else if (msg && 'voice' in msg) {
      const fileId = msg.voice.file_id;
      const buffer = await downloadTelegramMedia(ctx, fileId);
      if (buffer) {
        waPayload = { audio: buffer, ptt: true };
      }
    } 
    else if (msg && 'audio' in msg) {
      const fileId = msg.audio.file_id;
      const buffer = await downloadTelegramMedia(ctx, fileId);
      if (buffer) {
        waPayload = { audio: buffer, mimetype: msg.audio.mime_type || 'audio/mp4' };
      }
    } 
    else if (msg && 'document' in msg) {
      const fileId = msg.document.file_id;
      const buffer = await downloadTelegramMedia(ctx, fileId);
      if (buffer) {
        waPayload = { 
          document: buffer, 
          caption,
          mimetype: msg.document.mime_type || 'application/octet-stream',
          fileName: msg.document.file_name
        };
      }
    } 
    else if (msg && 'sticker' in msg) {
      const fileId = msg.sticker.file_id;
      const buffer = await downloadTelegramMedia(ctx, fileId);
      if (buffer) {
        // WhatsApp stickers strictly need specific format, 
        // passing it as an image as fallback requested
        waPayload = { image: buffer, caption: '[Sticker from Telegram]' };
      }
    } else {
      waPayload = { text: '[Pesan jenis ini belum didukung]' };
    }

    if (waPayload) {
      await sock.sendMessage(targetJid, waPayload);
      logMessage('TG->WA', `Forwarded message to ${targetJid}`);
    } else {
      ctx.reply('⚠️ Gagal memproses media dari Telegram.');
    }
  } catch (error) {
    logError(`Error forwarding TG -> WA: ${error}`);
    ctx.reply('⚠️ Terjadi error saat mengirim pesan ke WhatsApp.');
  }
}

export async function handleWhatsAppMessage(msg: WAMessage) {
  if (msg.key.fromMe) return; // Prevent loop if we also have an account mapped

  const fromJid = msg.key.remoteJid;
  if (!fromJid || fromJid === 'status@broadcast') return;

  const targetTgId = getTelegramByWhatsApp(fromJid);
  if (!targetTgId) return;

  const bot = getTelegramBot();
  if (!bot) return;

  try {
    const messageType = Object.keys(msg.message || {})[0];
    const messageContent = msg.message?.[messageType as keyof typeof msg.message];
    
    // Extract text/caption
    let textRep = '';
    if (messageType === 'conversation') {
      textRep = (msg.message?.conversation) || '';
    } else if (messageType === 'extendedTextMessage') {
      textRep = (msg.message?.extendedTextMessage?.text) || '';
    } else if ((messageContent as any)?.caption) {
      textRep = (messageContent as any).caption;
    }

    // Handle replies context
    let replyPrefix = '';
    const contextInfo = (messageContent as any)?.contextInfo;
    if (contextInfo?.quotedMessage) {
      // Find what it quoted
      replyPrefix = '> [Membalas pesan]\n';
    }
    
    const combinedText = replyPrefix + textRep;

    // Is it media?
    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(messageType);

    if (isMedia) {
      const media = await downloadWAMedia(msg);
      if (!media) {
        await bot.telegram.sendMessage(targetTgId, combinedText || '[Media Gagal Didownload]');
        return;
      }

      const input = { source: media.buffer };

      if (messageType === 'imageMessage') {
        await bot.telegram.sendPhoto(targetTgId, input, { caption: combinedText });
      } else if (messageType === 'videoMessage') {
        await bot.telegram.sendVideo(targetTgId, input, { caption: combinedText });
      } else if (messageType === 'audioMessage') {
        if ((messageContent as any).ptt) {
          await bot.telegram.sendVoice(targetTgId, input);
        } else {
          await bot.telegram.sendAudio(targetTgId, input);
        }
      } else if (messageType === 'documentMessage') {
        const fileName = (messageContent as any).fileName || 'Document.' + media.extension;
        await bot.telegram.sendDocument(targetTgId, { source: media.buffer, filename: fileName }, { caption: combinedText });
      } else if (messageType === 'stickerMessage') {
        await bot.telegram.sendSticker(targetTgId, input);
      }
    } else {
      // Handle unsupported or pure text
      if (textRep) {
        await bot.telegram.sendMessage(targetTgId, combinedText);
      } else if (messageType) {
        await bot.telegram.sendMessage(targetTgId, `>[Pesan jenis '${messageType}' belum didukung]`);
      }
    }

    logMessage('WA->TG', `Forwarded message from ${fromJid} to ${targetTgId}`);
  } catch (error) {
    logError(`Error forwarding WA -> TG: ${error}`);
    bot.telegram.sendMessage(targetTgId, '⚠️ Terjadi error saat meneruskan pesan dari WhatsApp.');
  }
}
