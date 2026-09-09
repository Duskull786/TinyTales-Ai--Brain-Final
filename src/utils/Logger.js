import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export class Logger {
  constructor(component) {
    this.component = component;
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level.toUpperCase()}] [${component || 'SYSTEM'}] ${message}${metaStr}`;
        })
      ),
      defaultMeta: { component: this.component },
      transports: [
        // Console output with colors
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, component }) => {
              return `${timestamp} [${component || 'SYSTEM'}] ${level}: ${message}`;
            })
          )
        }),
        // File output
        new winston.transports.File({
          filename: path.join(logsDir, 'tinytales.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true
        }),
        // Error-only file
        new winston.transports.File({
          filename: path.join(logsDir, 'errors.log'),
          level: 'error',
          maxsize: 10485760,
          maxFiles: 3
        })
      ]
    });
  }

  debug(message, meta = {}) {
    this.winston.debug(message, meta);
  }

  info(message, meta = {}) {
    this.winston.info(message, meta);
  }

  warn(message, meta = {}) {
    this.winston.warn(message, meta);
  }

  error(message, meta = {}) {
    this.winston.error(message, meta);
  }

  fatal(message, meta = {}) {
    this.winston.error(`FATAL: ${message}`, meta);
  }
}