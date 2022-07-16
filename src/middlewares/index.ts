/**
 * Custom middlewares.
 */
import { logging } from "../utils/logger"
import { Context, HttpError, Next } from "koa"

const logger = logging("middleware", false)

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
