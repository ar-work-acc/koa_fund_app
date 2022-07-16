/**
 * Custom middlewares.
 */
import { logging } from "../utils/logger"
import { Context, HttpError, Next } from "koa"

const logger = logging("middleware", false)

/**
 * Koa logger middleware: Morgan "dev" format.
 * @param ctx
 * @param next
 */
export const morgan = async (ctx: Context, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start

    // get status color
    let color =
        ctx.status >= 500
            ? 31 // red
            : ctx.status >= 400
            ? 33 // yellow
            : ctx.status >= 300
            ? 36 // cyan
            : ctx.status >= 200
            ? 32 // green
            : 0 // no color

    // format => :method :url :status :response-time ms - :res[content-length] bytes
    logger.debug(
        `${ctx.method} ${ctx.url} \x1b[${color}m${ctx.status}\x1b[0m ${ms}ms - ${ctx.length}`
    )
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
        if (err instanceof HttpError && 401 == err.status) {
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
