// always import App first to load environment variables from .env files:
import { App } from "./app"
import { logger } from "./utils/logger"
import { JWT_SECRET, DB_NAME, REDIS_URL, NODE_ENV } from "./config/index"

logger.debug(
    `Starting Koa server (server.ts), process.env.NODE_ENV = ${process.env.NODE_ENV}`
)
logger.debug(
    `server.ts: check, NODE_ENV: ${NODE_ENV}, JWT: ${JWT_SECRET}, DB_NAME: ${DB_NAME}, REDIS_URL: ${REDIS_URL}`
)
logger.debug(`environment variables: ${JSON.stringify(process.env)}`)

const app = new App()
app.start(true, true)
