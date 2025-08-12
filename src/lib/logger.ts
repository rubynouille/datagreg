export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
  userId?: string;
  requestId?: string;
  action?: string;
  duration?: number;
  statusCode?: number;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;
  private requestTracingEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.requestTracingEnabled = process.env.ENABLE_REQUEST_TRACING === 'true';
    
    // Set log level from environment variable
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLogLevel) {
      case 'DEBUG':
        this.minLevel = LogLevel.DEBUG;
        break;
      case 'INFO':
        this.minLevel = LogLevel.INFO;
        break;
      case 'WARN':
        this.minLevel = LogLevel.WARN;
        break;
      case 'ERROR':
        this.minLevel = LogLevel.ERROR;
        break;
      default:
        // Default to DEBUG in development, INFO in production
        this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const message = entry.message;
    
    if (this.isDevelopment) {
      // Pretty format for development
      let output = `[${timestamp}] ${levelName}: ${message}`;
      
      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      return output;
    } else {
      // JSON format for production (better for log aggregation)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formattedEntry = this.formatLogEntry(entry);

    // Use appropriate console method based on log level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedEntry);
        break;
      case LogLevel.INFO:
        console.info(formattedEntry);
        break;
      case LogLevel.WARN:
        console.warn(formattedEntry);
        break;
      case LogLevel.ERROR:
        console.error(formattedEntry);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Convenience methods for common patterns
  httpRequest(method: string, path: string, context?: LogContext): void {
    this.info(`HTTP ${method} ${path}`, {
      ...context,
      action: 'http_request',
      method,
      path,
    });
  }

  httpResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `HTTP ${method} ${path} - ${statusCode}`, {
      ...context,
      action: 'http_response',
      method,
      path,
      statusCode,
      duration,
    });
  }

  webhookCall(url: string, context?: LogContext): void {
    this.info(`Webhook call to ${url}`, {
      ...context,
      action: 'webhook_call',
      url,
    });
  }

  webhookResponse(url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `Webhook response from ${url} - ${statusCode}`, {
      ...context,
      action: 'webhook_response',
      url,
      statusCode,
      duration,
    });
  }

  databaseOperation(operation: string, table?: string, context?: LogContext): void {
    this.debug(`Database ${operation}${table ? ` on ${table}` : ''}`, {
      ...context,
      action: 'database_operation',
      operation,
      table,
    });
  }

  // Getter for request tracing status
  get isRequestTracingEnabled(): boolean {
    return this.requestTracingEnabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Middleware helper for request logging
export function createRequestLogger(requestId?: string) {
  const finalRequestId = logger.isRequestTracingEnabled ? requestId : undefined;
  
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...context, requestId: finalRequestId }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...context, requestId: finalRequestId }),
    warn: (message: string, context?: LogContext, error?: Error) => 
      logger.warn(message, { ...context, requestId: finalRequestId }, error),
    error: (message: string, context?: LogContext, error?: Error) => 
      logger.error(message, { ...context, requestId: finalRequestId }, error),
  };
}
