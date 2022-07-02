import Router from "@koa/router"
import apiRouter from "./api"

const router = new Router()

// Give APIs a version, always.
router.use("/api/v1", apiRouter.routes(), apiRouter.allowedMethods())

export default router
