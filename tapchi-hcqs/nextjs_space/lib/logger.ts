/**
 * Structured Logger
 * Provides consistent logging across the application
 * Suitable for internal military network deployment
 */

import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message?: string;
  context?: string;
  [key: string]: any;
}

class Logger {
  private logDir: string;
  private enableFileLogging: boolean;

  constructor() {
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';

    // Create log directory if it doesn't exist
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create log directory:', error);
        this.enableFileLogging = false;
      }
    }
  }

  private formatLog(level: LogLevel, data: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
    };

    if (typeof data === 'string') {
      entry.message = data;
    } else if (typeof data === 'object' && data !== null) {
      Object.assign(entry, data);
    } else {
      entry.message = String(data);
    }

    return entry;
  }

  private writeToFile(entry: LogEntry) {
    if (!this.enableFileLogging) return;

    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `app-${date}.log`;
      const filepath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(entry) + '\n';

      fs.appendFileSync(filepath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  private output(level: LogLevel, data: any) {
    const entry = this.formatLog(level, data);

    // Console output with colors
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         console.log;

    consoleMethod(
      `${colors[level]}[${entry.timestamp}] [${level.toUpperCase()}]${reset}`,
      entry.context ? `[${entry.context}]` : '',
      entry.message || '',
      entry.message ? '' : JSON.stringify(entry, null, 2)
    );

    // Write to file
    this.writeToFile(entry);
  }

  debug(data: any) {
    if (process.env.NODE_ENV === 'development') {
      this.output('debug', data);
    }
  }

  info(data: any) {
    this.output('info', data);
  }

  warn(data: any) {
    this.output('warn', data);
  }

  error(data: any) {
    this.output('error', data);
  }

  // Specialized logging methods
  api(method: string, path: string, data?: any) {
    this.info({
      context: 'API',
      method,
      path,
      ...data,
    });
  }

  db(operation: string, model: string, data?: any) {
    this.debug({
      context: 'DATABASE',
      operation,
      model,
      ...data,
    });
  }

  auth(event: string, userId?: string, data?: any) {
    this.info({
      context: 'AUTH',
      event,
      userId,
      ...data,
    });
  }

  security(event: string, data?: any) {
    this.warn({
      context: 'SECURITY',
      event,
      ...data,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
export type { LogLevel, LogEntry };
