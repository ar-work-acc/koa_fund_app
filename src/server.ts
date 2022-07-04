// always import App first to load environment variables from .env files:
import { App } from "./app"
import { logger } from "./utils/logger"

logger.debug(
    `Starting Koa server (server.ts), NODE_ENV = ${process.env.NODE_ENV}`
)
logger.debug(`environment variables: ${JSON.stringify(process.env)}`)

const app = new App()
app.start(true, true)
