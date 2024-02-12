# Build the Docker image
docker build -t device_simulator .  --platform=linux/amd64

# Run the Docker container
docker compose up 
# docker run -p 0.0.0.0:21000:21000 device_simulator