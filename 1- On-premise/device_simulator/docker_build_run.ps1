# Build the Docker image
docker build -t data_loger .  --platform=linux/amd64

# Run the Docker container
docker compose up  