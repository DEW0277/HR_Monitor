# 1-Bosqich: Build (Nomini AS builder deb saqlash shart)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

# 2-Bosqich: Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts

# Build qilingan fayllarni builder bosqichidan nusxalash
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p logs && chown -R node:node /app

USER node

EXPOSE 3000

# SIZDA FAYLLAR dist/src/main.js ICHIDA EKANLIGINI ANIQLADIK
CMD ["node", "dist/src/main.js"]