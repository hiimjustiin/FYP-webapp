# Use Bun Alpine as base image
FROM oven/bun:1-alpine as builder

# Accept build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application with environment variables baked in
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL config if deploying with HTTPS
# This will be used when SSL certificates are mounted
COPY nginx-ssl.conf /etc/nginx/nginx-ssl.conf

# Create startup script that switches to SSL if certificates exist
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'if [ -f /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/fullchain.pem ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "SSL certificates found, using nginx-ssl.conf"' >> /docker-entrypoint.sh && \
    echo '  cp /etc/nginx/nginx-ssl.conf /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'else' >> /docker-entrypoint.sh && \
    echo '  echo "No SSL certificates found, using default nginx.conf"' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80
EXPOSE 443

# Start nginx with SSL detection
CMD ["/docker-entrypoint.sh"]