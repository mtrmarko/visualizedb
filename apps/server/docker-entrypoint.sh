#!/bin/sh
set -e

# Navigate to the server directory
cd /app/server

# Run Prisma migrations to ensure the database schema is up-to-date
# This will create the database file if it doesn't exist
echo "Running database migrations..."
npx prisma migrate deploy

# Start the Node.js application
echo "Starting VisualizeDB server..."
exec node dist/index.js
