import { Context, Next } from "koa"

type MessageLogger = (message: string) => void

/**
 * Morgan with "dev" format. Pass a message logger function to log things.
 * @param messageLogger
 * @returns
 */
export const morgan = (messageLogger: MessageLogger = console.debug) => {
    return async (ctx: Context, next: Next) => {
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
        const message = `${ctx.method} ${ctx.url} \x1b[${color}m${ctx.status}\x1b[0m ${ms}ms - ${ctx.length}`
        messageLogger(message)
    }
}
