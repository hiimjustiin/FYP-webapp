#!/bin/sh
set -e

echo "🔄 Starting ILA Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U ${POSTGRES_USER:-ila_user}; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
if bun run db:migrate; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed! Exiting..."
  exit 1
fi

# Start the server
echo "🚀 Starting server..."
exec node dist/server.js
