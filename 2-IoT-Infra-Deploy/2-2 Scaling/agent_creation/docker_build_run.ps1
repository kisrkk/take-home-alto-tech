# Build the Docker image
docker build -t agent_simulator .  --platform=linux/amd64

# Run the Docker container
docker compose up  