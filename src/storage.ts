import fs from 'fs';
import path from 'path';
import { logData } from './logger';

export interface Mappings {
  [telegramChatId: string]: string; // Maps Telegram Chat ID to WhatsApp JID
}

const dataPath = path.join(process.cwd(), 'data', 'mappings.json');

export function loadMappings(): Mappings {
  try {
    if (!fs.existsSync(dataPath)) {
      // Ensure directory exists
      const dir = path.dirname(dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dataPath, JSON.stringify({}));
      return {};
    }
    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load mappings:', error);
    return {};
  }
}

export function saveMappings(mappings: Mappings) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(mappings, null, 2));
    logData('Mappings saved successfully.');
  } catch (error) {
    console.error('Failed to save mappings:', error);
  }
}

export function setMapping(telegramId: string | number, whatsappJid: string) {
  const mappings = loadMappings();
  mappings[telegramId.toString()] = whatsappJid;
  saveMappings(mappings);
}

export function removeMapping(telegramId: string | number) {
  const mappings = loadMappings();
  delete mappings[telegramId.toString()];
  saveMappings(mappings);
}

export function getWhatsAppByTelegram(telegramId: string | number): string | undefined {
  const mappings = loadMappings();
  return mappings[telegramId.toString()];
}

export function getTelegramByWhatsApp(whatsappJid: string): string | undefined {
  const mappings = loadMappings();
  // whatsappJid may include @s.whatsapp.net, let's standardize it or just exact match
  for (const [tgId, waJid] of Object.entries(mappings)) {
    if (waJid === whatsappJid) {
      return tgId;
    }
  }
  return undefined;
}
