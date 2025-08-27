export interface LogLevel {
  INFO: "info";
  WARN: "warn";
  ERROR: "error";
  DEBUG: "debug";
}

class Logger {
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (meta) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  }

  info(message: string, meta?: any): void {
    console.log(this.formatMessage("info", message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage("warn", message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.formatMessage("error", message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
