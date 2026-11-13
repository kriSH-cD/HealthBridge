.PHONY: dev test up infra down

# Postgres + Redis in Docker, server :8000 + frontend :5173 locally
dev: server/.env infra
	npm run migrate -w server
	npm run dev

test: infra
	npm test

# Only Postgres + Redis in Docker
infra:
	docker compose -f docker-compose.dev.yml up -d --wait

down:
	docker compose down

# Everything in Docker
up:
	docker compose up --build

server/.env:
	cp server/.env.example server/.env
