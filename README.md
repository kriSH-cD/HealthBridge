# SehatSetu (HealthBridge)

Telemedicine platform for Nabha and its 173 villages: multilingual (Punjabi, Hindi, English) consultations, health records, and medicine availability at local pharmacies.

Stack: React + Vite, FastAPI, PostgreSQL.

## Run

```bash
docker compose up --build
```

- App: http://localhost:5173
- API docs: http://localhost:8000/docs

## Develop without Docker for the app

Postgres still runs in Docker.

```bash
docker compose up -d db

cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd ..

npm install
npm run dev     # backend :8000 + frontend :5173
npm test        # backend + frontend tests
```

Tests use a separate `sehatsetu_test` database, created automatically.
