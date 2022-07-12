import { existsSync, mkdirSync } from "fs"
import path from "path"
import winston from "winston"
import winstonDaily from "winston-daily-rotate-file"
import { cwd } from "node:process"
import { LOG_DIR, CONSOLE_LOG_LEVEL } from "../config/index"

// create log directory if it does not exist yet:
const logDir: string = path.join(__dirname, "..", "..", LOG_DIR)
if (!existsSync(logDir)) {
    mkdirSync(logDir)
}

/**
 * logging: create loggers for each module
 * const logger = logging(__filename)
 *
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logging = (filename: string) => {
    // add file name info to log format:
    const logFormat = winston.format.printf(
        ({ timestamp, level, message }) =>
            `${timestamp} ${level} [${path.relative(
                cwd(),
                filename
            )}]: ${message}`
    )

    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss",
            }),
            logFormat
        ),
        transports: [
            // daily file debug log settings:
            new winstonDaily({
                level: "debug",
                datePattern: "YYYY-MM-DD",
                dirname: logDir + "/debug", // log file /logs/debug/*.log in save
                filename: `%DATE%.log`,
                maxFiles: 30, // 30 Days saved
                json: false,
                zippedArchive: true,
            }),
            // daily file error log settings:
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
            // console log settings:
            new winston.transports.Console({
                level: CONSOLE_LOG_LEVEL,
                format: winston.format.combine(
                    winston.format.splat(),
                    winston.format.colorize()
                ),
            }),
        ],
    })

    return logger
}

const logger = logging(__filename)
logger.debug(`*** Log check directory: ${LOG_DIR}, app version = 1.1 ***`)

export { logging }
