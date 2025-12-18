FROM oven/bun:1-alpine

# Install postgresql-client for pg_isready command and curl for health checks
RUN apk add --no-cache postgresql-client curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install all dependencies (including devDependencies for migrations)
# This ensures node-pg-migrate is available for running migrations
RUN bun install --frozen-lockfile

# Copy source code and entrypoint script
COPY . .

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Build the application
RUN bun run build

# Expose port
EXPOSE 3001

# Use entrypoint script to run migrations then start server
ENTRYPOINT ["/app/entrypoint.sh"]