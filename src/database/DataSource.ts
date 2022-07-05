import "reflect-metadata" // TypeORM requirement

import { join } from "path"
import { DataSource } from "typeorm"
import { DB_NAME, DB_PASSWORD, NODE_ENV, DB_HOST } from "../config/index"
import { logger } from "../utils/logger"

// data source singleton:
let datasource: DataSource | null = null

/**
 * Use NODE_ENV to get the appropriate datasource.
 * Generate a new datasource if it does not exist yet; else, return the singleton.
 * @returns the appropriate datasource
 */
export const AppDataSourceGenerator = (): DataSource => {
    let synchronize: boolean
    let dropSchema: boolean

    switch (NODE_ENV) {
        case "development":
            synchronize = true
            dropSchema = false
            break
        case "production":
            synchronize = false
            dropSchema = false
            break
        case "test":
            synchronize = true
            dropSchema = true
            break
        default:
            // default: don't sync, don't drop
            synchronize = false
            dropSchema = false
            break
    }

    if (datasource === null) {
        logger.debug(`Initializing new datasource for node env: ${NODE_ENV}`)
        datasource = new DataSource({
            type: "postgres",
            host: DB_HOST,
            port: 5432,
            username: "postgres",
            password: DB_PASSWORD,
            database: DB_NAME,
            entities: [join(__dirname, "../entities/**/*{.js,.ts}")],
            migrations: [join(__dirname, "../migrations/**/*{.js,.ts}")],
            // synchronize - Indicates if database schema should be auto created on every application launch.
            // Be careful with this option and don't use this in production - otherwise you can lose production data.
            //  As an alternative to it, you can use CLI and run schema:sync command.
            synchronize,
            dropSchema,
            logging: false,
        })
    }

    return datasource
}

/**
 * The singleton datasource for this NODE_ENV.
 */
export const AppDataSource = AppDataSourceGenerator()
