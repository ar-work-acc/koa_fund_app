import path from "path"
switch (process.env.NODE_ENV) {
    case "development":
    case "production":
        require("dotenv").config({
            path: path.join(__dirname, "../.env"),
        })
        break
    case "test":
        require("dotenv").config({
            path: path.join(__dirname, "../test.env"),
        })
        break
}

import {
    NODE_ENV,
    KOA_APP_KEY_0,
    KOA_APP_KEY_1,
    PORT,
    TEST_MODE,
} from "./config/index"
import { logger } from "./utils/logger"
import { readFileSync } from "fs"
import https from "https"
import Koa from "koa"
import koaStatic from "koa-static"
import bodyParser from "koa-bodyparser"
import router from "./routes/base"
import { morgan, jwtErrorSuppressor } from "./middlewares/index"
import { AppDataSource } from "./database/DataSource"
import { EmailQueue } from "./queue/bullmq"

logger.debug(`check KOA keys: ${KOA_APP_KEY_0}, ${KOA_APP_KEY_1}`)

/**
 * Koa.js app.
 *
 * const app = new App()
 * (await) app.start()
 */
export class App {
    public app: Koa
    private queue: EmailQueue

    constructor() {
        this.app = new Koa()

        this.app.keys = [KOA_APP_KEY_0, KOA_APP_KEY_1]
        this.app.use(morgan)
        this.app.use(jwtErrorSuppressor)
        this.app.use(koaStatic(path.join(__dirname, "../_app")))
        this.app.use(bodyParser())
        this.app.use(router.routes()).use(router.allowedMethods())

        // error handling:
        this.app.on("error", (err, ctx) => {
            console.error("server error", err, ctx)
        })
    }

    public async initializeDatabaseConnections() {
        try {
            logger.debug(`Server connecting to PostgreSQL...`)
            await AppDataSource.initialize()
            logger.debug(`Connected to PostgreSQL.`)
        } catch (error) {
            logger.error(`PostgreSQL connection error: ${error}`)
        }

        if (TEST_MODE == "false") {
            try {
                // Redis, BullMQ:
                logger.debug(`Server setting up queue with Redis...`)
                this.queue = new EmailQueue()
                await this.queue.initializeRepeatableJob()
            } catch (error) {
                logger.error(`Redis and queue set up error: ${error}`)
            }
        }
    }

    public async closeDatabaseConnections() {
        await AppDataSource.destroy()
        logger.debug(`PostgreSQL database connection closed by app.`)

        if (TEST_MODE == "false") {
            await this.queue.closeRedisConnections()
        }
    }

    public startSecureSever() {
        // HTTPS server:
        const options = {
            key: readFileSync(path.join(__dirname, "../_ssl/app.pem")),
            cert: readFileSync(path.join(__dirname, "../_ssl/app.crt")),
        }
        return https
            .createServer(options, this.app.callback())
            .listen(PORT, () => {
                logger.debug(
                    `[${NODE_ENV}] Koa HTTPS server started at port: ${PORT}`
                )
            })
    }

    public startHTTPServer() {
        return this.app.listen(PORT, () => {
            logger.debug(
                `[${NODE_ENV}] Koa HTTP server started at port: ${PORT}`
            )
        })
    }

    public async start() {
        await this.initializeDatabaseConnections()

        if (TEST_MODE === "false") {
            return this.startSecureSever()
        } else {
            return this.startHTTPServer()
        }
    }
}
