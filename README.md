# SehatSetu (HealthBridge)

Telemedicine platform for Nabha and its 173 villages: multilingual (Punjabi, Hindi, English) consultations, health records, and medicine availability at local pharmacies.

Stack: React + Vite, Node (Express + Prisma), PostgreSQL, Redis.

## Run

```bash
docker compose up --build
```

- App: http://localhost:5173
- API: http://localhost:8000/api/v1 (health: `/api/health`)

## Develop without Docker for the app

Postgres and Redis still run in Docker.

```bash
docker compose up -d db redis

npm install
cp server/.env.example server/.env
npm run migrate -w server   # apply Prisma migrations

npm run dev     # server :8000 + frontend :5173
npm test        # server + frontend tests
```

Server tests use a separate `sehatsetu_test` database (created automatically) and Redis DB 15.

Load demo data from the home page button, or `curl -X POST localhost:8000/api/v1/seed/seed-demo-data` (needs `ENABLE_DEMO_SEED=true`). Every demo account uses password `password123`.
