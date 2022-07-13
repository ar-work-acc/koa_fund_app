// always import App first to load environment variables from .env files:
import { App } from "./app"
import { logging } from "./utils/logger"
import { JWT_SECRET, DB_NAME, REDIS_URL, NODE_ENV } from "./config/index"

const logger = logging(__filename)
logger.debug(
    `Starting Koa server (server.ts), process.env.NODE_ENV = ${process.env.NODE_ENV}`
)
logger.debug(
    `server.ts: check, NODE_ENV: ${NODE_ENV}, JWT: ${JWT_SECRET}, DB_NAME: ${DB_NAME}, REDIS_URL: ${REDIS_URL}`
)
// logger.debug(`environment variables: ${JSON.stringify(process.env)}`)

const app = new App()

if (NODE_ENV === "production") {
    app.start(true, false)
} else {
    app.start(true, true)
}
