type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

export class AppLogger {
  private readonly service: string;

  constructor(service: string) {
    this.service = service;
  }

  private write(level: LogLevel, message: string, context: LogContext = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...context,
    };

    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(entry));
      return;
    }

    const label = `[${this.service}] ${level.toUpperCase()}`;
    console.log(label, message, context);
  }

  debug(message: string, context?: LogContext) {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.write("error", message, context);
  }
}

export const logger = new AppLogger("phause");
