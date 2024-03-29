#!/bin/bash

echo 'Docker: removing the old swarm stack...'
multipass exec node1 -- docker stack rm koa_fund_app

echo "Docker: log in."
docker login

echo 'Docker: push images to DockerHub'
docker compose push

echo 'Multipass: copy compose file to node 1'
multipass transfer docker-compose.yml node1:

echo 'Docker: deploy stack to Swarm'
multipass exec node1 -- docker stack deploy -c docker-compose.yml koa_fund_app

echo 'Update replicas from 1 to 3'
multipass exec node1 -- docker service update --replicas 3 koa_fund_app_app_funds
multipass exec node1 -- docker service update --replicas 3 koa_fund_app_nginx_node

echo 'Done!'