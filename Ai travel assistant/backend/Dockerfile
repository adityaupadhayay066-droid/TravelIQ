FROM node:20-alpine

# Security: Install curl for healthchecks
RUN apk --no-cache add curl

WORKDIR /app

# Pin dependencies and ensure lockfile is used consistently
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure upload directory exists and has non-root permissions
RUN mkdir -p /app/uploads/avatars /app/uploads/attachments /app/uploads/rag && \
    chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "server.js"]
