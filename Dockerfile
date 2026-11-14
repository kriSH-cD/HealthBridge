# Production: one image, Express serves the API and the built frontend.
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --ignore-scripts
COPY server/ ./
# generate needs a syntactically valid url, not a live database
RUN DATABASE_URL=postgresql://build@localhost/build npx prisma generate
COPY --from=web /web/dist ./public
ENV NODE_ENV=production WEB_DIST=/app/public
EXPOSE 8000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
