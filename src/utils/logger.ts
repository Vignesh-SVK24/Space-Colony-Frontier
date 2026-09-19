export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  prefix: string;
}

class Logger {
  private prefix: string;
  private isDev: boolean;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.isDev = import.meta.env ? import.meta.env.DEV : true;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.isDev) {
      console.debug(`[${this.prefix}] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    console.info(`[${this.prefix}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(`[${this.prefix}] ?? ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]) {
    console.error(`[${this.prefix}] ?? ${message}`, ...args);
  }
}

export const createLogger = (prefix: string) => new Logger(prefix);
export const defaultLogger = createLogger('Colony');
