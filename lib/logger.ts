const isServer = typeof window === 'undefined';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFn {
  (msg: string, ...args: any[]): void;
  (obj: object, msg?: string, ...args: any[]): void;
}

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

const logLevelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return logLevelPriority[level] >= logLevelPriority[currentLevel];
}

function formatLog(level: LogLevel, message: string | object, ...args: any[]) {
  if (!shouldLog(level)) return;

  if (isServer) {
    // Server-side: JSON format for better observability integration
    const timestamp = new Date().toISOString();
    let logObject: any = {
      level,
      time: timestamp,
    };

    if (typeof message === 'string') {
      logObject.msg = message;
    } else {
      Object.assign(logObject, message);
    }

    if (args.length > 0) {
      if (typeof args[0] === 'string' && !logObject.msg) {
        logObject.msg = args[0];
      } else {
        logObject.args = args;
      }
    }

    console.log(JSON.stringify(logObject));
  } else {
    // Client-side: Native console for better DX
    const consoleMethod = console[level] || console.log;
    
    // Add prefix for easier identification
    const prefix = `[${level.toUpperCase()}]`;
    
    if (typeof message === 'string') {
      consoleMethod(prefix, message, ...args);
    } else {
      consoleMethod(prefix, message, ...args);
    }
  }
}

const logger: Logger = {
  debug: (msg, ...args) => formatLog('debug', msg, ...args),
  info: (msg, ...args) => formatLog('info', msg, ...args),
  warn: (msg, ...args) => formatLog('warn', msg, ...args),
  error: (msg, ...args) => formatLog('error', msg, ...args),
};

export default logger;
