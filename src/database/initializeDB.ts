import path from "path"
if (process.env.NODE_ENV === "production") {
    require("dotenv").config({
        path: path.join(__dirname, "../../.env"),
    })
}
import { AppDataSourceGenerator } from "./DataSource"

import bcrypt from "bcrypt"
import { logger } from "../utils/logger"
import Account from "../entities/Account"
import ExchangeRate from "../entities/ExchangeRate"
import Fund, { FundType } from "../entities/Fund"
import SharePrice from "../entities/SharePrice"
import Order, { OrderStatus } from "../entities/Order"

// $ ts-node src/database/initializeDB.ts
export const runDatabaseDataInitialization = async (
    testMode: boolean = false
) => {
    try {
        logger.debug(
            `Running database data initialization, test mode = ${testMode}`
        )

        let dataSource
        if (!testMode) {
            dataSource = AppDataSourceGenerator(testMode)
            await dataSource.setOptions({ synchronize: true }).initialize()
        }
        
        logger.debug(`Starting data initialization...`)
        const today = new Date()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const usd = new ExchangeRate()
        usd.currency = "usd"
        usd.rate = 1
        usd.date = yesterday
        await usd.save()

        const euro_yesterday = new ExchangeRate()
        euro_yesterday.currency = "euro"
        euro_yesterday.rate = 0.9
        euro_yesterday.date = yesterday
        await euro_yesterday.save()

        const euro = new ExchangeRate()
        euro.currency = "euro"
        euro.rate = 0.95
        euro.date = today
        await euro.save()

        const ntd_yesterday = new ExchangeRate()
        ntd_yesterday.currency = "ntd"
        ntd_yesterday.rate = 28.0
        ntd_yesterday.date = yesterday
        await ntd_yesterday.save()

        const ntd = new ExchangeRate()
        ntd.currency = "ntd"
        ntd.rate = 29.68
        ntd.date = today
        await ntd.save()

        const user_signed = new Account()
        user_signed.username = "louis_huang"
        user_signed.password = bcrypt.hashSync("111", 10)
        user_signed.firstName = "Louis"
        user_signed.lastName = "Huang"
        user_signed.balance = 1000
        user_signed.isAgreementSigned = true
        user_signed.email = "meowfish.org@gmail.com"
        user_signed.isAdmin = true
        await user_signed.save()

        const user_not_signed = new Account()
        user_not_signed.username = "alice"
        user_not_signed.password = bcrypt.hashSync("222", 10)
        user_not_signed.firstName = "Alice"
        user_not_signed.lastName = "Miller"
        user_not_signed.balance = 500
        user_not_signed.isAgreementSigned = false
        user_not_signed.email = "alice@somewhere.com"
        await user_not_signed.save()

        const fund = new Fund()
        fund.name = "The best mutual fund"
        fund.type = FundType.PREPAY_TRADING_FEE
        fund.tradingFee = 0.015
        fund.prospectus = "Buy to earn. Maybe?"

        const spy = new SharePrice()
        spy.fund = fund
        spy.date = yesterday
        spy.value = 30.123

        const sp = new SharePrice()
        sp.fund = fund
        sp.date = today
        sp.value = 35.412

        fund.sharePrices = [spy, sp]
        await fund.save()

        const fund2 = new Fund()
        fund2.name = "Do not buy fund"
        fund2.type = FundType.NORMAL
        fund2.tradingFee = 0.1
        fund2.prospectus = "Buying = losing money"

        const spf2 = new SharePrice()
        spf2.fund = fund2
        spf2.date = today
        spf2.value = 10.984

        fund2.sharePrices = [spf2]
        await fund2.save()

        const orderYesterday = new Order()
        orderYesterday.account = user_signed
        orderYesterday.fund = fund
        orderYesterday.amount = 50
        orderYesterday.sharesBought = 1.87
        orderYesterday.status = OrderStatus.PURCHASED
        orderYesterday.orderedAt = yesterday
        orderYesterday.processedAt = yesterday
        await orderYesterday.save()

        const order = new Order()
        order.account = user_signed
        order.fund = fund
        order.amount = 100.0
        order.status = OrderStatus.ORDERED
        order.orderedAt = today
        await order.save()

        logger.debug(`Done generating initial data!`)

        if (!testMode) {
            await dataSource?.destroy()
        }
    } catch (error) {
        let message
        if (error instanceof Error) {
            message = error.message
        } else {
            message = String(error)
        }
        logger.error(
            `A database data initialization error occurred! Message = ${message}`
        )
    }
}

if (require.main === module) {
    // called directly:
    logger.debug(`Initializing database directly as a script...`)
    runDatabaseDataInitialization()
}
