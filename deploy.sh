#!/bin/bash
set -e

AWS_REGION="eu-west-2"
ECR_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Cleaning up old containers..."
docker compose -f docker.compose.staging.yml down || true

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL

echo "Pulling latest app images..."
docker compose -f docker.compose.staging.yml pull

echo "Starting containers..."
docker compose -f docker.compose.staging.yml up -d

echo "✅ Deployment complete!"