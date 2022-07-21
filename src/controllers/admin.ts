/**
 * These operations are for admins only.
 */
import { Context, Next } from "koa"
import Fund, { FundType } from "../entities/Fund"
import { logging } from "../utils/logger"
import Order, { OrderStatus } from "../entities/Order"
import SharePrice from "../entities/SharePrice"
import { MoreThan } from "typeorm"
import Account from "../entities/Account"
import { AppDataSource } from "../database/DataSource"
import Email from "../entities/Email"

const logger = logging(__filename)

/**
 * Allows admin to create a new share price for fund.
 *
 * This is used for demo.
 * It simulates the situation when a new share price update is available (so we can process orders).
 *
 * @param ctx
 * @param next
 */
export const createSharePrice = async (ctx: Context, next: Next) => {
  const fund = new Fund()
  fund.id = ctx.request.body?.fundId ?? 1 // get fund ID from body, if there's none, use ID = 1

  let sharePrice = new SharePrice()
  sharePrice.date = new Date()
  sharePrice.fund = fund
  sharePrice.value = ctx.request.body?.value ?? 30
  sharePrice = await sharePrice.save()

  ctx.status = 201
  ctx.body = sharePrice
}

/**
 * Allow admin to process user orders.
 *
 * If user balance is not enough at the time of processing,
 * cancel the order and return any pre-paid trading fee.
 *
 * This is used for demo.
 * TODO: this should be moved to a queue since it might take a long time!
 * @param ctx
 * @param next
 */
export const processOrders = async (ctx: Context, next: Next) => {
  // process the first 10 unprocessed orders:
  const orders = await Order.find({
    skip: 0,
    take: 10,
    order: {
      orderedAt: "ASC",
    },
    relations: {
      account: true,
      fund: true,
    },
    where: {
      status: OrderStatus.ORDERED,
    },
  })

  const processedOrderIds = []

  for (const order of orders) {
    let isFundSharePurchased = false

    logger.debug(`Processing order: ${order.id}, for ${order.account.username}`)

    // get user account to check if balance is enough:
    const account = await Account.findOne({
      where: {
        id: order.account.id,
      },
    })
    if (account === null) {
      throw new Error(`Order missing account info, order ID: ${order.id}`)
    }

    const fund = await Fund.findOne({
      where: {
        id: order.fund.id,
      },
    })
    if (fund === null) {
      throw new Error(`Order missing fund info, order ID: ${order.id}`)
    }

    // find first share price of fund, where its date > order date:
    const sharePrice = await SharePrice.findOne({
      where: {
        fund: {
          id: order.fund.id,
        },
        date: MoreThan(order.orderedAt),
      },
      order: {
        date: "ASC",
      },
    })

    // can't process this order yet, continue to next order:
    if (sharePrice === null) {
      continue
    }

    logger.debug(
      `Account balance BEFORE order processing: ${account.balance} for order: ${order.id}`
    )
    switch (fund.type) {
      case FundType.NORMAL: {
        // substract fee now:
        const amountToPay = order.amount * (1 + fund.tradingFee)
        if (amountToPay > account.balance) {
          logger.debug(`User does not have enough balance. Order aborted.`)
          order.status = OrderStatus.CANCELED
          order.processedAt = new Date()
          await order.save()
        } else {
          await AppDataSource.manager.transaction(
            async (transactionalEntityManager) => {
              order.sharesBought = order.amount / sharePrice.value
              order.status = OrderStatus.PURCHASED
              order.processedAt = new Date()
              await transactionalEntityManager.save(order)

              account.balance -= amountToPay
              await transactionalEntityManager.save(account)
            }
          )
          isFundSharePurchased = true
        }
        break
      }
      case FundType.PREPAY_TRADING_FEE:
        // fee is already paid:
        if (order.amount > account.balance) {
          logger.debug(
            `User does not have enough balance. Order aborted. Return trading fee.`
          )
          await AppDataSource.manager.transaction(
            async (transactionalEntityManager) => {
              order.status = OrderStatus.CANCELED
              order.processedAt = new Date()
              await transactionalEntityManager.save(order)

              // return pre-paid trading fee:
              account.balance += order.amount * fund.tradingFee
              await transactionalEntityManager.save(account)
            }
          )
        } else {
          await AppDataSource.manager.transaction(
            async (transactionalEntityManager) => {
              order.sharesBought = order.amount / sharePrice.value
              order.status = OrderStatus.PURCHASED
              order.processedAt = new Date()
              await transactionalEntityManager.save(order)

              account.balance -= order.amount
              await transactionalEntityManager.save(account)
            }
          )
          isFundSharePurchased = true
        }
        break
    }

    logger.debug(
      `Account balance AFTER order processing: ${account.balance} for order: ${order.id}`
    )
    processedOrderIds.push(order.id)

    // email to send (for another system):
    const email = new Email()
    email.email = account.email
    email.orderId = order.id
    email.isSuccess = isFundSharePurchased
    await email.save()
  }

  ctx.body = {
    message: "Done processing! E-mail will be sent by another system.",
    processedOrderIds,
  }
}
