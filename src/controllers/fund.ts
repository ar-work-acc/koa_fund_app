import { Context, Next } from "koa"
import ExchangeRate from "../entities/ExchangeRate"
import Fund, { FundType } from "../entities/Fund"
import { logger } from "../utils/logger"
import { getAccount, getPageAndPageSize } from "./util/parser"
import Order from "../entities/Order"
import { AppDataSource } from "../database/DataSource"

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

    logger.debug(
        `Found ${target.currency} = ${target.rate}, date = ${target.date}`
    )

    ctx.body = target
}

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
        amountOrdered = amount / targetExchangeRate.rate
    }
    logger.debug(
        `Amount ordered in USD: ${amountOrdered}; original currency = ${currency}, original amount = ${amount}`
    )

    // now, get the fund so we can check what type it is (prepaid or not):
    const fund = await Fund.findOneBy({ id: fundId })

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
