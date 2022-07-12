/**
 * Routes to be used under: /api/v1
 */
import Router from "@koa/router"
import jwtMiddleware from "koa-jwt"
import { JWT_SECRET } from "../config"
import { logging } from "../utils/logger"
import { getLoginUser, login } from "../controllers/login"
import {
    createOrder,
    getExchangeRate,
    getFund,
    getFundList,
    getOrder,
    getOrderList,
} from "../controllers/fund"
import { createSharePrice, processOrders } from "../controllers/admin"
import { adminOnly } from "../middlewares/admin"

const logger = logging(__filename)

// base router:
const apiRouter = new Router()

// only log in path is not protected by JWT, and 'public' paths (described below)
apiRouter.post("login", "/login", login)

/**
 * JWT protected API routes:
 * Middleware below this line is only reached if JWT token is valid
 * unless the URL starts with '/public'
 *
 * https://github.com/Foxandxss/koa-unless
 **/
apiRouter.use(
    jwtMiddleware({ secret: JWT_SECRET }).unless({
        path: [/^\/public/],
    })
)

apiRouter.get("login-user-detail", "/user", getLoginUser)
apiRouter.get("exchange-rate-detail", "/exchangeRate", getExchangeRate)
apiRouter.get("fund-list", "/funds", getFundList)
apiRouter.get("fund-detail", "/funds/:id", getFund)
apiRouter.get("order-list", "/orders", getOrderList)
apiRouter.post("order-create", "/orders", createOrder)
apiRouter.get("order-detail", "/orders/:id", getOrder)

// admin-only operations:
apiRouter.post(
    "admin-create-share-price",
    "/admin/createSharePrice",
    adminOnly,
    createSharePrice
)
apiRouter.post(
    "admin-process-orders",
    "/admin/processOrders",
    adminOnly,
    processOrders
)

export default apiRouter
