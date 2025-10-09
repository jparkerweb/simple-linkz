FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
COPY src/input.css ./src/

# Build Tailwind CSS
RUN npm install tailwindcss && \
    npx tailwindcss -i ./src/input.css -o ./public/styles.css --minify && \
    npm uninstall tailwindcss

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "src/server.js"]
