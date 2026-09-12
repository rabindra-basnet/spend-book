import pino from 'pino';
import path from 'node:path';
import fs from 'node:fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const queueLogger = pino(
  {
    level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  },
  pino.destination({
    dest: path.join(logsDir, 'queue.log'),
    sync: true,
  }),
);
