import { Context, Next } from "koa"
import ExchangeRate from "../entities/ExchangeRate"
import Fund, { FundType } from "../entities/Fund"
import { logging } from "../utils/logger"
import { getAccount, getPageAndPageSize } from "./util/parser"
import Order from "../entities/Order"
import { AppDataSource } from "../database/DataSource"

const logger = logging(__filename)

/**
 * Get the latest exchange rate for a specific currency.
 * @param ctx get query param "currency" from ctx
 * @param next
 */
export const getExchangeRate = async (ctx: Context, next: Next) => {
    let currency = ctx.request.query.currency
    currency = Array.isArray(currency) ? currency[0] : currency

    logger.debug(`Get latest exchange rate for ${currency}.`)

    const target = await ExchangeRate.findOne({
        where: {
            currency,
        },
        order: {
            date: "DESC",
        },
    })

    if (target === null) {
        throw new Error(`Can't find exchange rate for currency: ${currency}`)
    }

    logger.debug(
        `Found ${target.currency} = ${target.rate}, date = ${target.date}`
    )

    ctx.body = target
}

/**
 * Get a page of fund list (ordered by ID).
 * Use query params: page, pageSize to get a specific page of fund.
 * Default: first page with a size of 10.
 * @param ctx
 * @param next
 */
export const getFundList = async (ctx: Context, next: Next) => {
    const [page, pageSize] = getPageAndPageSize(ctx)

    const [funds, count] = await Fund.findAndCount({
        skip: page * pageSize,
        take: pageSize,
        order: {
            id: "ASC",
        },
    })

    ctx.body = {
        funds,
        count,
    }
}

/**
 * Get fund detail by fund ID (path param).
 * @param ctx
 * @param next
 */
export const getFund = async (ctx: Context, next: Next) => {
    const { id } = ctx.params
    logger.debug(`Getting fund detail: ${id}`)

    const fund = await Fund.findOne({
        where: { id },
        relations: {
            sharePrices: true,
        },
    })

    ctx.body = { fund }
}

/**
 * Get details for an order from order ID; also checks JWT token for user ID
 * and only allows access if the user owns that order.
 * @param ctx
 * @param next
 */
export const getOrder = async (ctx: Context, next: Next) => {
    const { id } = ctx.params
    // only get orders for the logged in account:
    const accountId = ctx.state.user.data.id
    logger.debug(`Getting order detail: ${id} for account: ${accountId}`)

    const order = await Order.findOne({
        where: {
            id,
            account: {
                id: accountId,
            },
        },
    })

    ctx.body = order
}

/**
 * Get the list of orders for a user, ordered by ID, DESC.
 * Uses query param: page, pageSize (default: first page, size = 10)
 * @param ctx
 * @param next
 */
export const getOrderList = async (ctx: Context, next: Next) => {
    const [page, pageSize] = getPageAndPageSize(ctx)

    // only get orders for the logged in account:
    const accountId = ctx.state.user.data.id
    logger.debug(`User : ${accountId}`)

    const [orders, count] = await Order.findAndCount({
        where: { account: { id: accountId } },
        skip: page * pageSize,
        take: pageSize,
        relations: {
            account: true,
            fund: true,
        },
        select: {
            account: {
                id: true,
                username: true,
            },
            fund: {
                id: true,
                name: true,
            },
        },
        order: {
            id: "DESC",
        },
    })

    ctx.body = {
        orders,
        count,
    }
}

/**
 * Create a new order for user.
 * Checks if user has signed the agreement, and also have enough balance.
 * Also converts the amount ordered to USD first.
 * If the fund type is pre-paid type, subtract the trading fee from balance first.
 *
 * @param ctx
 * @param next
 * @returns
 */
export const createOrder = async (ctx: Context, next: Next) => {
    const account = await getAccount(ctx)

    if (!account.isAgreementSigned) {
        ctx.status = 400
        ctx.body = {
            message: "User have to sign the agreement first.",
        }
        return
    }

    const {
        fundId, //fund ID
        amount,
        currency = "usd",
    } = ctx.request.body

    // if amount is not in USD, convert it first with the latest exchange rate:
    // [amountOrdered]: converted to USD, use this
    let amountOrdered = amount
    if (currency !== "usd") {
        const targetExchangeRate = await ExchangeRate.findOne({
            where: {
                currency,
            },
            order: {
                date: "DESC",
            },
        })

        if (targetExchangeRate === null) {
            throw new Error(
                `Can not find exchange rate for currency: ${currency}`
            )
        }

        amountOrdered = amount / targetExchangeRate.rate
    }
    logger.debug(
        `Amount ordered in USD: ${amountOrdered}; original currency = ${currency}, original amount = ${amount}`
    )

    // now, get the fund so we can check what type it is (prepaid or not):
    const fund = await Fund.findOneBy({ id: fundId })
    if (fund === null) {
        throw new Error(`Cannot find fund for fund ID = ${fundId}`)
    }

    switch (fund.type) {
        case FundType.NORMAL:
            if (account.balance < amountOrdered * (1 + fund.tradingFee)) {
                ctx.status = 400
                ctx.body = {
                    message: "User balance is not enough.",
                }
                return
            }
            // just place an order:
            let order = new Order()
            order.account = account
            order.fund = fund
            order.amount = amountOrdered
            order.orderedAt = new Date()
            order = await order.save()

            ctx.body = order
            break
        case FundType.PREPAY_TRADING_FEE:
            if (account.balance < amountOrdered * (1 + fund.tradingFee)) {
                ctx.status = 400
                ctx.body = {
                    message: "User balance is not enough.",
                }
                return
            }
            // start a transaction, subtract fee from account (if its type is PREPAY_TRADING_FEE)
            await AppDataSource.manager.transaction(
                async (transactionalEntityManager) => {
                    logger.debug(`Transaction: place order...`)

                    // first part of transaction: subtract trading fee from account:
                    account.balance -= amountOrdered * fund.tradingFee
                    await transactionalEntityManager.save(account)

                    // second part of transaction: place the order
                    let order = new Order()
                    order.account = account
                    order.fund = fund
                    order.amount = amountOrdered
                    order.orderedAt = new Date()
                    await transactionalEntityManager.save(order)

                    ctx.body = order

                    logger.debug(`Transaction: Order placed!`)
                }
            )
            break
    }

    ctx.status = 201
}
