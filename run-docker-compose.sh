#!/bin/bash

# Script to clean and rebuild/run Docker compose:
usage() {
    echo "Usage: $0 [-fd]" >&2
    echo "Run Docker compose" >&2
    echo "  -f  full (clean, build, and redeploy with Docker compose)" >&2
    echo "  -d  Docker re-deploy only (do not rebuild source code)" >&2
    exit 1
}

if [[ "$#" -lt 1 ]]
then
    usage
fi

REBUILD=1

while getopts fd OPTION
do
    case $OPTION in
        f) REBUILD=1 ;;
        d) REBUILD=0 ;;
        ?) usage ;;
    esac
done

if [[ $REBUILD = 1 ]]
then
    echo 'Re-build JS/TS source code...'
    npm run clean
    npm run build
fi

echo 'Re-deploy with Docker compose...'
docker compose down --volumes
docker volume prune -f
docker image prune -f
docker compose up -d --build
docker container ls -a

echo
echo 'Done!'
