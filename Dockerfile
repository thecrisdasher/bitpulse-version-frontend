FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for sharp (image optimization)
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy prisma schema first (needed for postinstall script)
COPY prisma ./prisma/

# Install dependencies (this will run postinstall which needs prisma schema)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build-time ARG for reCAPTCHA site key (needed in client bundle)
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

# Build-time ARG for socket URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Build the application
RUN pnpm build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application using the custom server
CMD ["node", "server.js"] 