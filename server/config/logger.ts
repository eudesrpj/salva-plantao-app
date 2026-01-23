/**
 * Structured Logger
 * 
 * Provides structured logging with different levels (info, warn, error)
 * and ensures sensitive data is not logged.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: any;
}

/**
 * Format timestamp for logs
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {};
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "authorization",
    "cookie",
    "session"
  ];

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = getTimestamp();
  const sanitizedContext = context ? sanitizeContext(context) : {};
  
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...sanitizedContext,
  };

  const logString = JSON.stringify(logEntry);

  switch (level) {
    case "error":
      console.error(logString);
      break;
    case "warn":
      console.warn(logString);
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.log(logString);
      }
      break;
    default:
      console.log(logString);
  }
}

/**
 * Logger instance with convenience methods
 */
export const logger = {
  info(message: string, context?: LogContext): void {
    log("info", message, context);
  },

  warn(message: string, context?: LogContext): void {
    log("warn", message, context);
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    };
    log("error", message, errorContext);
  },

  debug(message: string, context?: LogContext): void {
    log("debug", message, context);
  },

  /**
   * Log HTTP request/response
   */
  http(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    log("info", "HTTP Request", {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...context,
    });
  },
};

/**
 * Simple console logger for non-JSON output (backwards compatible)
 */
export function simpleLog(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}
