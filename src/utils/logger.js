import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        const levelColor = {
            error: '\x1b[31m',
            warn: '\x1b[33m', 
            info: '\x1b[36m',
            debug: '\x1b[35m',
            verbose: '\x1b[32m'
        };
        
        const reset = '\x1b[0m';
        const coloredLevel = `${levelColor[level] || ''}${level.toUpperCase()}${reset}`;
        
        const logMessage = stack ? `${message}\n${stack}` : message;
        return `[${timestamp}] ${coloredLevel}: ${logMessage}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new winston.transports.Console({
            format: logFormat
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'errors.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    ]
});

// Bot specific logger
export const botLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] 🤖 BOT ${level.toUpperCase()}: ${message}`;
                })
            )
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'bot.log'),
            format: fileFormat,
            maxsize: 5242880,
            maxFiles: 5,
            tailable: true
        })
    ]
});

// API specific logger
export const apiLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] 🌐 API ${level.toUpperCase()}: ${message}`;
                })
            )
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'api.log'),
            format: fileFormat,
            maxsize: 5242880,
            maxFiles: 5,
            tailable: true
        })
    ]
});

// Database specific logger
export const dbLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] 🗄️  DB ${level.toUpperCase()}: ${message}`;
                })
            )
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'database.log'),
            format: fileFormat,
            maxsize: 5242880,
            maxFiles: 5,
            tailable: true
        })
    ]
});

export default logger;