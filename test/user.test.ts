// note this "App" import has to go first to load .env (before others use environment variables)
import { App } from "../src/app"
import supertest from "supertest"
import http from "http"

import { logging } from "../src/utils/logger"
import { runDatabaseDataInitialization } from "../src/database/initializeDB"
import range from "lodash/range"
import Email from "../src/entities/Email"
import { EmailQueue } from "../src/queue/bullmq"
import { NODE_ENV, JWT_SECRET, DB_NAME, REDIS_URL } from "../src/config/index"

const logger = logging(__filename)

describe("APIs admin: users", () => {
  let app: App
  let server: http.Server
  let agent: supertest.SuperAgentTest

  // user data:
  let authorizationHeaderAdmin: string // Bearer + ' ' + JWT token; this user is also an admin, and has signed the agreement
  let balanceAdmin: number
  let authorizationHeaderUser: string // for another user that did not sign agreement and is not admin
  let exchangeRateNTD: number

  let fund1OrderId: number
  let fund1TradingFee: number
  const fund1OrderAmount = 200

  let fund2OrderId: number
  let fund2TradingFee: number
  const fund2OrderAmount = 150

  beforeAll(async () => {
    logger.debug(
      `TEST: check, NODE_ENV: ${NODE_ENV}, JWT: ${JWT_SECRET}, DB_NAME: ${DB_NAME}, REDIS_URL: ${REDIS_URL}`
    )
    expect(NODE_ENV).toBe("test")
    expect(DB_NAME).toBe("app_funds_test")

    logger.debug(`[beforeAll] *** init Koa server and DB with supertest ***`)
    app = new App()
    server = await app.start(false, false)
    await runDatabaseDataInitialization(true)
    agent = supertest.agent(server)
  }, 1 * 60 * 1000)

  afterAll(async () => {
    logger.debug(`[afterAll] *** destroy DB connection, close Koa server ***`)
    await app.closeDatabaseConnections(false)
    await server.close()
  }, 1 * 60 * 1000)

  test("user log in", async () => {
    // with wrong password, expect a 401
    let response = await agent
      .post("/api/v1/login")
      .send({ username: "louis_huang", password: "Wrong password!!!" })
      .set("Accept", "application/json")
    expect(response.status).toBe(401)

    // correct, should get JWT token back
    response = await agent
      .post("/api/v1/login")
      .send({ username: "louis_huang", password: "111" })
      .set("Accept", "application/json")
    expect(response.status).toBe(200)
    expect(response.body.message).toBe("User authenticated.")
    // save the JWT token in header for later use:
    authorizationHeaderAdmin = `Bearer ${response.body.token}`

    // get token for another user:
    response = await agent
      .post("/api/v1/login")
      .send({ username: "alice", password: "222" })
      .set("Accept", "application/json")
    expect(response.status).toBe(200)
    expect(response.body.message).toBe("User authenticated.")
    authorizationHeaderUser = `Bearer ${response.body.token}`
  })

  test("get user data", async () => {
    // if you don't send the header, should be 401
    let response = await agent.get("/api/v1/user")
    expect(response.status).toBe(401)
    expect(response.body.message).toBe(
      "Protected resource, use Authorization header to get access"
    )

    // get user data
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.username).toBe("louis_huang")
    expect(response.body.balance).toBe(1000)
    balanceAdmin = response.body.balance
    expect(response.body.isAgreementSigned).toBe(true)
    expect(response.body.isAdmin).toBe(true)
  })

  test("get fund list", async () => {
    let response = await agent.get("/api/v1/funds")
    expect(response.status).toBe(401)

    response = await agent
      .get("/api/v1/funds")
      .set("Authorization", authorizationHeaderAdmin)
      .query({ page: 2, pageSize: 1 })

    expect(response.body.count).toBe(2)
    expect(response.body.funds.length).toBe(1) // page size = 1
    expect(response.body.funds[0].id).toBe(2)
    expect(response.body.funds[0].name).toBe("Do not buy fund")
    expect(response.body.funds[0].type).toBe(0)
    expect(response.body.funds[0].tradingFee).toBe(0.1)
  })

  test("get fund detail", async () => {
    let response = await agent.get("/api/v1/funds/2")
    expect(response.status).toBe(401)

    // fund 2
    response = await agent
      .get("/api/v1/funds/2")
      .set("Authorization", authorizationHeaderAdmin)

    expect(response.body.fund.id).toBe(2)
    expect(response.body.fund.name).toBe("Do not buy fund")
    expect(response.body.fund.type).toBe(0)
    expect(response.body.fund.tradingFee).toBe(0.1)
    fund2TradingFee = response.body.fund.tradingFee
    expect(response.body.fund.sharePrices.length).toBe(1)
    expect(response.body.fund.sharePrices[0].value).toBe(10.984)

    // fund 1
    response = await agent
      .get("/api/v1/funds/1")
      .set("Authorization", authorizationHeaderAdmin)

    expect(response.body.fund.id).toBe(1)
    expect(response.body.fund.name).toBe("The best mutual fund")
    expect(response.body.fund.type).toBe(1)
    expect(response.body.fund.tradingFee).toBe(0.015)
    fund1TradingFee = response.body.fund.tradingFee
    expect(response.body.fund.sharePrices.length).toBe(2)
    expect(response.body.fund.sharePrices[0].value).toBe(30.123)
  })

  test("get exchange rate", async () => {
    // user wants to place order in NTD:
    let response = await agent
      .get("/api/v1/exchangeRate")
      .query({ currency: "ntd" })
    expect(response.status).toBe(401)

    response = await agent
      .get("/api/v1/exchangeRate")
      .query({ currency: "ntd" })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.body.currency).toBe("ntd")
    expect(response.body.rate).toBe(29.68)
    exchangeRateNTD = response.body.rate
  })

  test("get orders", async () => {
    const response = await agent
      .get("/api/v1/orders")
      .set("Authorization", authorizationHeaderAdmin)
      .query({ page: 1, pageSize: 10 })

    expect(response.body.orders.length).toBe(2)
    expect(response.body.orders[0].amount).toBe(100)
  })

  test("place order: user did not sign agreement", async () => {
    const response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 2,
        amount: 50,
        currency: "ntd",
      })
      .set("Authorization", authorizationHeaderUser)
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("User have to sign the agreement first.")
  })

  test("place order: more than balance", async () => {
    let response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 2,
        amount: (balanceAdmin + 1) * 30,
        currency: "ntd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("User balance is not enough.")

    // balance should remain the same:
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)

    // and the order list should remain the same:
    response = await agent
      .get("/api/v1/orders")
      .set("Authorization", authorizationHeaderAdmin)
      .query({ page: 1, pageSize: 10 })

    expect(response.body.orders.length).toBe(2)
    expect(response.body.orders[0].amount).toBe(100)
  })

  test("place order: normal type fund 2, ntd", async () => {
    let response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 2,
        amount: fund2OrderAmount * exchangeRateNTD,
        currency: "ntd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(201) // created order, 201
    expect(response.body.fund.id).toBe(2)
    fund2OrderId = response.body.id

    // balance should remain the same for this fund type:
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)

    // check if the order is placed:
    response = await agent
      .get("/api/v1/orders")
      .set("Authorization", authorizationHeaderAdmin)
      .query({ page: 1, pageSize: 10 })

    expect(response.body.orders.length).toBe(3) // order +1
    expect(response.body.orders[0].amount).toBe(fund2OrderAmount) // the amount should match
    expect(response.body.orders[0].sharesBought).toBe(0)
    expect(response.body.orders[0].status).toBe(0)
    expect(response.body.orders[0].account.id).toBe(1) // account ID should match
    expect(response.body.orders[0].fund.id).toBe(2) // so should fund ID
  })

  test("place order: prepay type fund 1, ntd", async () => {
    let response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 1,
        amount: fund1OrderAmount * exchangeRateNTD,
        currency: "ntd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(201) // created order, 201
    expect(response.body.fund.id).toBe(1)
    fund1OrderId = response.body.id

    // balance should be subtracted by trading fee first
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    logger.debug(`*** balance: ${balanceAdmin}`)
    balanceAdmin = balanceAdmin - fund1OrderAmount * fund1TradingFee
    logger.debug(
      `*** balance: ${balanceAdmin} (after pre pay trading fee for fund 1)`
    )
    expect(response.body.balance).toBe(balanceAdmin)

    // check if the order is placed:
    response = await agent
      .get("/api/v1/orders")
      .set("Authorization", authorizationHeaderAdmin)
      .query({ page: 1, pageSize: 10 })

    expect(response.body.orders.length).toBe(4) // order +1
    expect(response.body.orders[0].amount).toBe(fund1OrderAmount) // the amount should match
    expect(response.body.orders[0].sharesBought).toBe(0)
    expect(response.body.orders[0].status).toBe(0)
    expect(response.body.orders[0].account.id).toBe(1) // account ID should match
    expect(response.body.orders[0].fund.id).toBe(1) // so should fund ID
  })

  test("admin: process orders, but the orders are not updated since there's no new share prices", async () => {
    const response = await agent
      .post("/api/v1/admin/processOrders")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.message).toBe(
      "Done processing! E-mail will be sent by another system."
    )
    expect(response.body.processedOrderIds.length).toBe(0)
  })

  test("get order", async () => {
    let response = await agent
      .get(`/api/v1/orders/${fund2OrderId}`)
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe(0)
    expect(response.body.amount).toBe(fund2OrderAmount)
    expect(response.body.sharesBought).toBe(0)

    // other users shouldn't be able to get order info
    response = await agent
      .get(`/api/v1/orders/${fund2OrderId}`)
      .set("Authorization", authorizationHeaderUser)
    expect(response.status).toBe(204)
  })

  test("admin: create new shared price for fund 2, then process orders", async () => {
    const targetFundSharePriceValue = 50
    let response = await agent
      .post("/api/v1/admin/createSharePrice")
      .set("Authorization", authorizationHeaderAdmin)
      .send({
        fundId: 2,
        value: targetFundSharePriceValue,
      })
    expect(response.status).toBe(201)
    expect(response.body.fund.id).toBe(2)
    expect(response.body.value).toBe(targetFundSharePriceValue)

    response = await agent
      .post("/api/v1/admin/processOrders")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.processedOrderIds.length).toBe(1)

    balanceAdmin = balanceAdmin - fund2OrderAmount * (1 + fund2TradingFee)
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)
    logger.debug(
      `*** balance: ${balanceAdmin} (after order for fund 2 is processed)`
    )

    // check if order status is updated:
    response = await agent
      .get(`/api/v1/orders/${fund2OrderId}`)
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe(1)
    expect(response.body.amount).toBe(fund2OrderAmount)
    expect(response.body.sharesBought).toBe(
      fund2OrderAmount / targetFundSharePriceValue
    )
  })

  test("admin: create new shared price for fund 1 and process orders", async () => {
    // create share price for fund 1:
    const targetFundSharePriceValue = 20
    let response = await agent
      .post("/api/v1/admin/createSharePrice")
      .set("Authorization", authorizationHeaderAdmin)
      .send({
        fundId: 1,
        value: targetFundSharePriceValue,
      })
    expect(response.status).toBe(201)
    expect(response.body.fund.id).toBe(1)
    expect(response.body.value).toBe(targetFundSharePriceValue)

    // process orders:
    response = await agent
      .post("/api/v1/admin/processOrders")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.processedOrderIds.length).toBe(2)

    // check if the balance is correct:
    balanceAdmin -= 100 // for previous order (initializeDB.ts)
    balanceAdmin = balanceAdmin - fund1OrderAmount
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)
    logger.debug(
      `*** balance: ${balanceAdmin} (after order for fund 1 is processed)`
    )

    // check if order status is updated:
    response = await agent
      .get(`/api/v1/orders/${fund1OrderId}`)
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe(1) // 1: order purchased
    expect(response.body.amount).toBe(fund1OrderAmount)
    expect(response.body.sharesBought).toBe(
      fund1OrderAmount / targetFundSharePriceValue
    )
  })

  test("place 3 orders: when 2 of them exceed user's remaining balance", async () => {
    logger.debug(`*** balance: ${balanceAdmin} (multiple orders start)`)
    // this order should be okay (fund 2 first order)
    let response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 2,
        amount: 400,
        currency: "usd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(201) // created order, 201
    expect(response.body.fund.id).toBe(2)
    const fund2Order1Id = response.body.id

    // this order should fail (fund 2 second order)
    response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 2,
        amount: 400,
        currency: "usd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(201) // created order, 201
    expect(response.body.fund.id).toBe(2)
    const fund2Order2Id = response.body.id

    // check balance, shouldn't change for fund 2 orders:
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)

    // this order should be rejected later (fund 1 order)
    response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 1,
        amount: 200,
        currency: "usd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(201) // created order, 201
    expect(response.body.fund.id).toBe(1)
    const fund1OrderId = response.body.id

    // check balance after placing an order for fund 1 (pre-paid)
    balanceAdmin = balanceAdmin - 200 * fund1TradingFee
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)

    // create new share price for fund2, and process fund 2 orders:
    const targetFundSharePriceValue = 50
    response = await agent
      .post("/api/v1/admin/createSharePrice")
      .set("Authorization", authorizationHeaderAdmin)
      .send({
        fundId: 2,
        value: targetFundSharePriceValue,
      })
    expect(response.status).toBe(201)
    expect(response.body.fund.id).toBe(2)
    expect(response.body.value).toBe(targetFundSharePriceValue)

    // process the order from fund 2 (the second one fails):
    response = await agent
      .post("/api/v1/admin/processOrders")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.processedOrderIds.length).toBe(2)
    balanceAdmin = balanceAdmin - 400 * (1 + fund2TradingFee)

    // check balance:
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)
    logger.debug(
      `*** balance: ${balanceAdmin} (after orders for fund 2 is processed)`
    )

    // now create a new share price for fund one:
    response = await agent
      .post("/api/v1/admin/createSharePrice")
      .set("Authorization", authorizationHeaderAdmin)
      .send({
        fundId: 1,
        value: targetFundSharePriceValue,
      })
    expect(response.status).toBe(201)
    expect(response.body.fund.id).toBe(1)
    expect(response.body.value).toBe(targetFundSharePriceValue)

    // and process the order for fund 1:
    response = await agent
      .post("/api/v1/admin/processOrders")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.processedOrderIds.length).toBe(1)

    // the order should fail; pre-paid fee should be returned, check balance:
    balanceAdmin = balanceAdmin + 200 * fund1TradingFee
    response = await agent
      .get("/api/v1/user")
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(1)
    expect(response.body.balance).toBe(balanceAdmin)
    logger.debug(
      `*** balance: ${balanceAdmin} (after another order for fund 1 is processed)`
    )

    // check status of orders:
    // fund 2 order:
    response = await agent
      .get(`/api/v1/orders/${fund2Order1Id}`)
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe(1)
    expect(response.body.amount).toBe(400)
    expect(response.body.sharesBought).toBe(400 / targetFundSharePriceValue)

    // fund 2 second order:
    response = await agent
      .get(`/api/v1/orders/${fund2Order2Id}`)
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe(2)
    expect(response.body.amount).toBe(400)
    expect(response.body.sharesBought).toBe(0) // canceled

    // fund 1 order:
    response = await agent
      .get(`/api/v1/orders/${fund1OrderId}`)
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe(2) // canceled!
    expect(response.body.amount).toBe(200)
    expect(response.body.sharesBought).toBe(0) // bought nothing
  })

  test("non-admin should not be able to add share price", async () => {
    const response = await agent
      .post("/api/v1/admin/createSharePrice")
      .set("Authorization", authorizationHeaderUser)
      .send({
        fundId: 2,
        value: 1,
      })
    expect(response.status).toBe(401)
  })

  test("get fund list with wrong params: page, pageSize", async () => {
    const response = await agent
      .get("/api/v1/funds")
      .set("Authorization", authorizationHeaderAdmin)
      .query({ page: "x", pageSize: "y" })

    expect(response.body.count).toBe(2)
    expect(response.body.funds.length).toBe(2) // default page size = 10
    expect(response.body.funds[0].id).toBe(1)
    expect(response.body.funds[0].name).toBe("The best mutual fund")
    expect(response.body.funds[0].type).toBe(1)
    expect(response.body.funds[0].tradingFee).toBe(0.015)
  })

  test("order fund 1 without enough balance", async () => {
    const response = await agent
      .post("/api/v1/orders")
      .send({
        fundId: 1,
        amount: balanceAdmin + 1,
        currency: "usd",
      })
      .set("Authorization", authorizationHeaderAdmin)
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("User balance is not enough.")
  })

  test("email queue", async () => {
    // create 20 new fake emails to send
    for (const idx of range(20)) {
      const email = new Email()
      email.email = "meowfishorg@gmail.com"
      email.orderId = 1000 + idx
      email.isSuccess = true
      email.isProcessed = false
      await email.save()
    }

    const initialUnprocessedEmailCount = await Email.count({
      where: {
        isProcessed: false,
      },
    })

    await EmailQueue.processAndSendEmails()

    const leftUnprocessedEmailCount = await Email.count({
      where: {
        isProcessed: false,
      },
    })

    expect(initialUnprocessedEmailCount - 10).toBe(leftUnprocessedEmailCount)
  })
})
