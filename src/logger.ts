export interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'message';
  direction?: 'TG->WA' | 'WA->TG';
  content: string;
}

const memoryLogs: LogEntry[] = [];
// Keep only last 100 logs
const MAX_LOGS = 100;

export function addLog(entry: Omit<LogEntry, 'timestamp'>) {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  memoryLogs.unshift(fullEntry);
  if (memoryLogs.length > MAX_LOGS) {
    memoryLogs.pop();
  }
  
  console.log(`[${fullEntry.type.toUpperCase()}] ${fullEntry.direction ? `[${fullEntry.direction}]` : ''} ${fullEntry.content}`);
}

export function logInfo(content: string) {
  addLog({ type: 'info', content });
}

export function logError(content: string) {
  addLog({ type: 'error', content });
}

export function logMessage(direction: 'TG->WA' | 'WA->TG', content: string) {
  addLog({ type: 'message', direction, content });
}

export function logData(description: string) {
    console.log(`[DATA] ${description}`);
}

export function getLogs(): LogEntry[] {
  return memoryLogs;
}
