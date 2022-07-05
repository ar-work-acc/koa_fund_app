import { Context } from "koa"
import Account from "../../entities/Account"
import { logger } from "../../utils/logger"

/**
 * Parses context for params page and page size.
 * @param ctx Koa context
 * @returns array of page and page size: [page, pageSize]
 */
export const getPageAndPageSize = (ctx: Context) => {
    let { page, pageSize } = ctx.request.query
    page = Array.isArray(page) ? page[0] : page ?? "1"
    pageSize = Array.isArray(pageSize) ? pageSize[0] : pageSize ?? "10"

    logger.debug(`Got params: page = ${page}, pageSize = ${pageSize}`)

    let queryPage: number
    let queryPageSize: number

    queryPage = parseInt(page) - 1
    if (isNaN(queryPage)) {
        queryPage = 0
    }

    queryPageSize = parseInt(pageSize)
    if (isNaN(queryPageSize)) {
        queryPageSize = 10
    }

    logger.debug(`Query: page = ${queryPage}, pageSize = ${queryPageSize}`)

    return [queryPage, queryPageSize]
}

/**
 * Get current user account from context.
 */
export const getAccount = async (ctx: Context) => {
    const accountId = ctx.state.user.data.id
    const account = await Account.findOneBy({ id: accountId })
    if (account === null) {
        throw new Error("Can not get account from context! (check JWT token)")
    }
    return account
}
