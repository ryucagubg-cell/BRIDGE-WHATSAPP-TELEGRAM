import { NextResponse, NextRequest } from 'next/server';
import { setMapping, removeMapping, loadMappings } from '@/src/storage';

export async function POST(req: NextRequest) {
  try {
    const { action, telegramId, whatsappJid } = await req.json();

    if (action === 'add') {
      if (!telegramId || !whatsappJid) {
        return NextResponse.json({ error: 'Missing telegramId or whatsappJid' }, { status: 400 });
      }
      
      let cleaned = whatsappJid.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
      }
      if (!cleaned.endsWith('@s.whatsapp.net')) {
        cleaned = cleaned + '@s.whatsapp.net';
      }

      setMapping(telegramId, cleaned);
      return NextResponse.json({ success: true, mappings: loadMappings() });
    } else if (action === 'delete') {
      if (!telegramId) {
        return NextResponse.json({ error: 'Missing telegramId' }, { status: 400 });
      }
      removeMapping(telegramId);
      return NextResponse.json({ success: true, mappings: loadMappings() });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
