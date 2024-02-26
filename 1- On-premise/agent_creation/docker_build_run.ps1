
# Build the Docker image
docker build -t agent_simulator:latest .  --platform=linux/amd64

# Run the Docker container
# docker compose up  
docker run agent_simulator