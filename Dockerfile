# Build Stage
FROM node:26-slim AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies including devDependencies for the build
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build delisha-marie

# Run Stage
FROM node:26-slim

# Create non-root user for security reasons
RUN useradd -m -u 1001 nodejs

WORKDIR /app

# Copy built application and package files from build stage
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/package-lock.json /app/package-lock.json

# Install only production dependencies
RUN npm ci --ignore-scripts --only=production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 8080

# Start the server
CMD ["npm", "run", "serve:ssr:delisha-marie"]
