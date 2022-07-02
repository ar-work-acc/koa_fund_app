import "reflect-metadata" // TypeORM requirement

import { join } from "path"
import { DataSource } from "typeorm"
import {
    DB_NAME,
    TEST_DB_NAME,
    DB_PASSWORD,
    NODE_ENV,
    DB_HOST,
    TEST_MODE, // note: TEST_MODE is a string, not boolean!
} from "../config/index"
import { logger } from "../utils/logger"

const synchronizeOrNot = NODE_ENV == "development" ? true : false
logger.debug(
    `Datasource using NODE_ENV=${NODE_ENV}, DB_HOST=${DB_HOST} synchronize schema: ${synchronizeOrNot}!`
)

// data source singleton:
let datasource = null
export const AppDataSourceGenerator = (
    testMode: boolean = false
): DataSource => {
    if (datasource === null) {
        logger.debug(`Initializing new datasource, testMode = ${testMode}`)
        datasource = new DataSource({
            type: "postgres",
            host: DB_HOST,
            port: 5432,
            username: "postgres",
            password: DB_PASSWORD,
            database: testMode ? TEST_DB_NAME : DB_NAME,
            entities: [
                // join(__dirname, "../entities/User.ts"),
                join(__dirname, "../entities/**/*{.js,.ts}"),
            ],
            migrations: [join(__dirname, "../migrations/**/*{.js,.ts}")],
            // synchronize - Indicates if database schema should be auto created on every application launch.
            // Be careful with this option and don't use this in production - otherwise you can lose production data.
            //  As an alternative to it, you can use CLI and run schema:sync command.
            synchronize: testMode ? true : synchronizeOrNot,
            dropSchema: testMode ? true : false,
            logging: false,
        })
    }

    return datasource
}

export const AppDataSource = AppDataSourceGenerator(
    TEST_MODE === "false" ? false : true
)
