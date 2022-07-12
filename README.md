# Funds demo app

## Notes for this demo

1. Passwords, credentials and the like shouldn't be commited to Git.
2. Scheduled jobs can be done in another system.

## Development notes

NODE_ENV should always be given a value: "development", "production", or "test".  
Each environment has its own PostgreSQL DB and Redis index (same Redis instance, different index).

## Environment variables settings:

1. Use dotenv for local development (development and test).
2. Use Dockerfile ENV for production.

dotenv test set up with Jest:  
https://jestjs.io/docs/configuration#setupfiles-array

```
NODE_ENV=test DOTENV_CONFIG_PATH=./_test.env jest --setupFiles dotenv/config --runInBand --verbose
```

dotenv local development (nodemon.json):  
https://nodejs.org/api/cli.html#-r---require-module

```
NODE_ENV=development DOTENV_CONFIG_PATH=./_dev.env npx ts-node -r dotenv/config --files src/server.ts
```

## Code structure

app_funds: React app

src: Koa.js server code

-   config: environment variables
-   controllers
-   database: DB settings
-   entities: ORM entries
-   middlewares
-   migrations
-   routes: API routes
-   utils
-   app.ts
-   server.ts: main

run.sh: production DB is initialized here; will run after wait-for-it.sh

## Other notes

Send JWT token back in authorization header:
Authorization: "Bearer (token)"

## Run project

Local (with TypeScript, use nodemon):

```
$ npm run resetdb
$ npm run initdb
$ npm run dev
```

## Build for Docker

To build the image:

```
$ npm run clean
$ npm run build
$ npm run resetProdDB (if you didn't start with a clean database)
$ npm run docker
```

Access app at: https://localhost:3333/  
account, password = louis_huang, 111; alice, 222

## BullMQ (queue with Redis)

Use this to remove previous records of tasks:

```
$ redis-cli -a pw20220501 flushall
```

## TODOs

1. Multiple test databases for testing.
2. Spring-like @Transactional middleware (or services).
3. Use: "@/..." for imports; TS settings (optional).
4. More on BullMQ (queues, important!).
5. More on Redis as a database.
6. Swagger (optional).
7. Jest, mock.
