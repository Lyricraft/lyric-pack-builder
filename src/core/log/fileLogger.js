import winston from "winston";
import {checkEnum, StringType, stringUsable} from "../public/type.js";
import {ArgTypeError} from "../public/errors.js";
import {LogType} from "./logTypes.js";

const logLevelMap = new Map()
    .set(LogType.LOG, 'LOG')
    .set(LogType.INFO, 'INF')
    .set(LogType.WARN, 'WRN')
    .set(LogType.DEBUG, 'DBG')
    .set(LogType.ERROR, 'ERR');

export class FileLogger {
    init(filePath) {
        if (this.logger) {
            throw new Error('FileLogger already initialized');
        }

        if (!stringUsable(filePath, StringType.FILE_PATH)) {
            throw new ArgTypeError('filePath', 'string(FilePath)', filePath);
        }

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.printf(({timestamp, level, message }) => {
                    return `[${timestamp}] [${logLevelMap.get(level)}] ${message}`;
                })
            ),
            transports: [
                new winston.transports.File({ filename: filePath })
            ]
        });
    }

    log(level, message) {
        if (!this.logger) {
            console.warn('FileLogger not initialized, some logs may be lost.');
            return;
        }

        if (level === 'log') {
            level = 'info';
        }
        if (checkEnum(LogType, level)) {
            this.logger[level](message);
        } else {
            this.logger.info(`[${level}] ${message}`);
        }
    }
}

export const FILE_LOGGER = new FileLogger();