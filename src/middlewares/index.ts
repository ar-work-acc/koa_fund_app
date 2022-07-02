/**
 * This should be applied to "app" before other middlewares.
 */
import { logger } from "../utils/logger"
import { Context, Next } from "koa"

export default (app) => {
    // show response time: Morgan
    app.use(async (ctx: Context, next: Next) => {
        await next()
        const rt = ctx.response.get("X-Response-Time")
        logger.debug(`${ctx.method} ${ctx.url} - ${rt}`)
    })

    app.use(async (ctx: Context, next: Next) => {
        const start = Date.now()
        await next()
        const ms = Date.now() - start
        ctx.set("X-Response-Time", `${ms}ms`)
    })

    // suppress JWT error messages:
    app.use(async (ctx: Context, next: Next) => {
        try {
            await next()
        } catch (err) {
            if (401 == err.status) {
                logger.error(`401 Unauthorized: ${ctx.method} ${ctx.url}`)
                ctx.status = 401
                ctx.body = {
                    message:
                        "Protected resource, use Authorization header to get access",
                }
            } else {
                throw err
            }
        }
    })

    // ctx.body should always be an object:
    // app.use(async (ctx, next) => {
    //     await next()

    //     ctx.assert.equal(
    //         "object",
    //         typeof ctx.body,
    //         500,
    //         "ctx.body should always be an object"
    //     )
    // })
}
