FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# generate needs a syntactically valid url, not a live database
RUN DATABASE_URL=postgresql://build@localhost/build npx prisma generate

EXPOSE 8000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
