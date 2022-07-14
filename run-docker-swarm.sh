#!/bin/bash

docker login
docker compose push
multipass transfer docker-compose.yml node1:
multipass exec node1 -- docker stack deploy -c docker-compose.yml koa_fund_app
