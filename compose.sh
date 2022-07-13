#!/bin/bash

# Script to clean and rebuild/run Docker compose:
npm run clean
npm run build
docker compose down
npm run dockerPrune
npm run docker

docker container ls -a
echo
echo 'Done!'
