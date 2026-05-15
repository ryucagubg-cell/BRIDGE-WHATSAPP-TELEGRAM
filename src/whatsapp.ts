import type { proto, WAMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import { logError, logInfo } from './logger';
import { handleWhatsAppMessage } from './bridge';
import fs from 'fs';
import path from 'path';

let sock: any = null;
let currentQr: string | null = null;
let connectionState: 'connecting' | 'open' | 'close' | 'qr' = 'connecting';

const sessionDir = path.join(process.cwd(), 'temp', 'baileys_auth');

export async function startWhatsApp() {
  const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = await import('@whiskeysockets/baileys');
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.macOS('Desktop'),
    logger: pino({ level: 'silent' }) as any,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      connectionState = 'qr';
      logInfo('WhatsApp QR Code generated, please scan.');
    }

    if (connection === 'close') {
      currentQr = null;
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      logInfo(`WhatsApp connection closed due to ${lastDisconnect?.error}. Reconnecting: ${shouldReconnect}`);
      connectionState = 'close';
      
      if (shouldReconnect) {
        setTimeout(startWhatsApp, 3000);
      } else {
        // Logged out
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        logInfo('WhatsApp logged out. Restarting flow.');
        setTimeout(startWhatsApp, 3000);
      }
    } else if (connection === 'open') {
      currentQr = null;
      connectionState = 'open';
      logInfo('WhatsApp successfully connected!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      // Handle incoming messages
      await handleWhatsAppMessage(msg);
    }
  });
}

export function getWhatsAppSocket() {
  return sock;
}

export function getWhatsAppState() {
  return {
    state: connectionState,
    qr: currentQr
  };
}

export async function downloadWAMedia(msg: WAMessage): Promise<{ buffer: Buffer; mimetype: string; extension: string } | null> {
  const messageType = Object.keys(msg.message || {})[0];
  const messageContent = msg.message?.[messageType as keyof proto.IMessage];
  
  if (!messageContent) return null;

  let stream: any;
  let mimetype = '';
  let extension = '';

  const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');

  try {
    if (messageType === 'imageMessage') {
      stream = await downloadContentFromMessage(messageContent as any, 'image');
      mimetype = (messageContent as any).mimetype || 'image/jpeg';
      extension = 'jpg';
    } else if (messageType === 'videoMessage') {
      stream = await downloadContentFromMessage(messageContent as any, 'video');
      mimetype = (messageContent as any).mimetype || 'video/mp4';
      extension = 'mp4';
    } else if (messageType === 'audioMessage') {
      stream = await downloadContentFromMessage(messageContent as any, 'audio');
      mimetype = (messageContent as any).mimetype || 'audio/mp4';
      extension = (messageContent as any).ptt ? 'ogg' : 'mp3';
    } else if (messageType === 'documentMessage') {
      stream = await downloadContentFromMessage(messageContent as any, 'document');
      mimetype = (messageContent as any).mimetype || 'application/octet-stream';
      extension = (messageContent as any).fileName?.split('.').pop() || 'bin';
    } else if (messageType === 'stickerMessage') {
      stream = await downloadContentFromMessage(messageContent as any, 'sticker');
      mimetype = 'image/webp';
      extension = 'webp';
    } else {
      return null;
    }

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return { buffer, mimetype, extension };
  } catch (error) {
    logError(`Failed to download WA media: ${error}`);
    return null;
  }
}
