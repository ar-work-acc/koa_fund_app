import { existsSync, mkdirSync } from "fs"
import path from "path"
import winston from "winston"
import winstonDaily from "winston-daily-rotate-file"

import { LOG_DIR, CONSOLE_LOG_LEVEL } from "../config/index"

// logs dir
const logDir: string = path.join(__dirname, "..", "..", LOG_DIR)
console.log(`*** Log check directory: ${LOG_DIR}, app version = 1.1 ***`)

if (!existsSync(logDir)) {
    mkdirSync(logDir)
}

/**
 * Logger
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logFormat = winston.format.printf(
    ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
)

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        logFormat
    ),
    transports: [
        // debug log setting
        new winstonDaily({
            level: "debug",
            datePattern: "YYYY-MM-DD",
            dirname: logDir + "/debug", // log file /logs/debug/*.log in save
            filename: `%DATE%.log`,
            maxFiles: 30, // 30 Days saved
            json: false,
            zippedArchive: true,
        }),
        // error log setting
        new winstonDaily({
            level: "error",
            datePattern: "YYYY-MM-DD",
            dirname: logDir + "/error", // log file /logs/error/*.log in save
            filename: `%DATE%.log`,
            maxFiles: 30, // 30 Days saved
            handleExceptions: true,
            json: false,
            zippedArchive: true,
        }),
    ],
})

logger.add(
    new winston.transports.Console({
        level: CONSOLE_LOG_LEVEL,
        format: winston.format.combine(
            winston.format.splat(),
            winston.format.colorize()
        ),
    })
)

const stream = {
    write: (message: string) => {
        logger.info(message.substring(0, message.lastIndexOf("\n")))
    },
}

export { logger, stream }
