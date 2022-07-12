import { Context, Next } from "koa"
import { logging } from "../utils/logger"

const logger = logging(__filename)

/**
 * Allows access only if user is an administrator. If not, throw a 401.
 *
 * @param ctx
 * @param next
 */
export const adminOnly = async (ctx: Context, next: Next) => {
    const isAdmin: boolean = ctx.state.user.data.isAdmin
    logger.debug(`isAdmin: ${isAdmin}`)

    if (!isAdmin) {
        ctx.throw(401, "access_denied", { user: ctx.state.user.data })
    }

    await next()
}
