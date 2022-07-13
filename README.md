# Funds demo app

## Notes for this demo

1. Passwords, credentials and the like shouldn't be commited to Git.
2. Scheduled jobs can be done in another system.
3. Original requirements and sequence diagram: data/\*.pdf

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
$ docker compose down (if you started docker previously)
$ npm run dockerPrune
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

## Other notes

1. Winston: don't add line numbers because it would impact performance, as stated in:  
   https://github.com/winstonjs/winston/issues/200
2. Send JWT token back in authorization header:  
   Authorization: "Bearer (token)"  
   https://swagger.io/docs/specification/authentication/bearer-authentication/

## HTTPS

Generate a self-signed SSL certificate using OpenSSL:  
https://www.openssl.org/docs/man1.0.2/man1/openssl-req.html

```
$ openssl req -x509 -newkey rsa:4096 -keyout cert.key -out cert.pem -sha256 -days 3650
```

Nginx settings:  
https://nginx.org/en/docs/http/ngx_http_ssl_module.html  
For a certificate with a password:  
http://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_password_file  