/**
 * Custom middlewares.
 */
import { logger } from "../utils/logger"
import { Context, Next } from "koa"

/**
 * Morgan middleware.  
 * 
 * Should always be applied first to check the response time for a requested resource.
 * @param ctx
 * @param next
 */
export const morgan = async (ctx: Context, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    ctx.set("X-Response-Time", `${ms}ms`)
    logger.debug(`${ctx.method} ${ctx.url} - ${ms}ms`)
}

/**
 * Middleware to suppress JWT exceptions.
 *
 * @param ctx
 * @param next
 */
export const jwtErrorSuppressor = async (ctx: Context, next: Next) => {
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
}
