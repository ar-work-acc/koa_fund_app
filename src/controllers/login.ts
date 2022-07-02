import { logger } from "../utils/logger"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config"
import { Context, Next } from "koa"
import { compare } from "bcrypt"
import Account from "../entities/Account"

/**
 * Returns user data if logged in; else 401.
 * @param ctx
 * @param next
 */
export const getLoginUser = async (ctx: Context, next: Next) => {
    const id = ctx.state.user.data.id
    const account = await Account.findOneBy({ id })
    ctx.body = account
}

/**
 * For user log in. Issues a JWT token if authentication is successful.
 * @param ctx
 * @param next
 */
export const login = async (ctx: Context, next: Next) => {
    const { username, password } = ctx.request.body
    logger.debug(`Entered username: ${username}, password: ${password}`)

    const foundAccount = await Account.findOne({
        where: { username },
        select: {
            id: true,
            username: true,
            password: true,
            firstName: true,
            lastName: true,
            createdDate: true,
            balance: true,
            isAgreementSigned: true,
            isAdmin: true,
            email: true,
        },
    })

    if (foundAccount) {
        logger.debug(`Found user password: ${foundAccount.password}`)
        const passwordMatches = await compare(password, foundAccount.password)
        if (passwordMatches) {
            logger.debug(`User authenticated successfully!`)

            // remember not to send your password hash to user:
            foundAccount.password = null

            let token = jwt.sign(
                {
                    data: foundAccount,
                },
                JWT_SECRET,
                {
                    expiresIn: "7d",
                }
            )
            logger.debug("token", JSON.stringify(token))

            ctx.body = {
                token,
                message: "User authenticated.",
            }
            return
        }
    }

    // if you're still here, log in failed, return 401:
    logger.debug(`Authentication failed!`)
    ctx.status = 401
    ctx.body = {
        token: null,
        message: "User authentication failed!",
    }
}
