/**
 * Custom middlewares.
 */
import { logging } from "../utils/logger"
import { Context, HttpError, Next } from "koa"
import originalMorgan from "morgan"

const logger = logging("middleware", false)

/**
 * Koa wrapper for original Express morgan middleware.
 *
 * @param ctx
 * @param next
 */
export const koaMorgan = async (ctx: Context, next: Next) => {
    const morganLogger = logging("morgan", false)
    // "dev" format:
    // :method :url :status :response-time ms - :res[content-length] bytes
    const fn = originalMorgan("dev", {
        stream: {
            write: (message: string) => {
                morganLogger.info(
                    message.substring(0, message.lastIndexOf("\n")) + " bytes"
                )
            },
        },
    })

    fn(ctx.req, ctx.res, (err) => {
        if (err) {
            morganLogger.error(`A logging error occurred: ${err}`)
        }
    })

    await next()
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
