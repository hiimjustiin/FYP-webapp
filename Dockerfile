# Use Node.js 18 Alpine as base image
FROM node:18-alpine as builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

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