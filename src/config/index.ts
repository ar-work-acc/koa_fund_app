export const {
    NODE_ENV = "development",
    JWT_SECRET = "dev-jwt-secret",
    KOA_APP_KEY_0 = "dev-app-key-0",
    KOA_APP_KEY_1 = "dev-app-key-1",
    LOG_DIR = "_logs",
    CONSOLE_LOG_LEVEL = "debug",

    DB_HOST = "localhost",
    DB_NAME = "app_funds",
    DB_PASSWORD = "pw20220501",
    TEST_DB_NAME = "app_funds_test",
    TEST_MODE = "false", // note: this is a string, not a boolean!
    PORT = 3000,
    REDIS_URL = "redis://:pw20220501@localhost:6379/0",
} = process.env
