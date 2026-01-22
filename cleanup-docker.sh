#!/bin/bash

echo "Stopping all containers..."
docker stop $(docker ps -q)

echo "Removing all containers..."
docker rm $(docker ps -aq)

echo "Removing all images..."
docker rmi $(docker images -q) --force

echo "Removing all volumes..."
docker volume rm $(docker volume ls -q)

echo "Removing unused networks..."
docker network prune -f

echo "Docker cleanup complete!"
