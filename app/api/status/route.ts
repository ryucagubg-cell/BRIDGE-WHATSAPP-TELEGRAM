import { NextResponse } from 'next/server';
import { getWhatsAppState } from '@/src/whatsapp';
import { getLogs } from '@/src/logger';
import { loadMappings } from '@/src/storage';

export async function GET() {
  const waState = getWhatsAppState();
  const logs = getLogs();
  const mappings = loadMappings();

  return NextResponse.json({
    whatsapp: waState,
    logs,
    mappings,
  });
}
