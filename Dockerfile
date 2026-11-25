FROM node:22-alpine

WORKDIR /app

# Install build tools required for native modules like better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]