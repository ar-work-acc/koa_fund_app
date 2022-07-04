# Funds demo app

## Notes for this demo

1. Passwords, credentials and the like shouldn't be commited to Git.
2. Should set ENV in Dockerfile instead.
3. Scheduled jobs can be done in another system.

## Development notes

NODE_ENV should always be set as an environment variables, with values: "development", "production", "test". Each has its own PostgreSQL DB and Redis index (same Redis instance, different index).

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

For local development, create database "app_funds" and "app_funds_test" first.

## Build for Docker

To build the image:

```
$ npm run clean
$ npm run build
$ npm run resetProdDB
$ npm run docker
```

Access app at: https://localhost:3333/  
account, password = louis_huang, 111; alice, 222

## BullMQ (queue with Redis)

Use this to remove previous records of tasks:

```
$ redis-cli -a pw20220501 flushall
```
