/**
 * Centralized Logger Utility
 * Provides consistent logging across the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  private prefix: string;

  constructor(prefix: string = 'App') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    }[level];

    return `${emoji} [${this.prefix}] ${message}`;
  }

  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(this.formatMessage('info', message), context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message), context || '');
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(
      this.formatMessage('error', message),
      error instanceof Error ? error.message : error,
      context || ''
    );
  }

  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }

  success(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`✅ [${this.prefix}] ${message}`, context || '');
    }
  }
}

// Pre-configured loggers for different modules
export const gameLogger = new Logger('ItoGame');
export const voteLogger = new Logger('Vote');
export const apiLogger = new Logger('API');
export const firebaseLogger = new Logger('Firebase');

// Default export
export default Logger;
