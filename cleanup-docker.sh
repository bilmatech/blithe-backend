#!/bin/bash

echo "Stopping all containers..."
if [ "$(docker ps -q)" ]; then
    docker stop $(docker ps -q)
else
    echo "No running containers to stop"
fi

echo "Removing all containers..."
if [ "$(docker ps -aq)" ]; then
    docker rm $(docker ps -aq)
else
    echo "No containers to remove"
fi

echo "Removing all images..."
if [ "$(docker images -q)" ]; then
    docker rmi $(docker images -q) --force
else
    echo "No images to remove"
fi

echo "Removing all volumes..."
if [ "$(docker volume ls -q)" ]; then
    docker volume rm $(docker volume ls -q)
else
    echo "No volumes to remove"
fi

echo "Removing unused networks..."
docker network prune -f

echo "Docker cleanup complete!"