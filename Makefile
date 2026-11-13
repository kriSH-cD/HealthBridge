.PHONY: dev test up

# Postgres + Redis in Docker, server :8000 + frontend :5173 locally
dev: server/.env
	docker compose up -d --wait db redis
	npm run migrate -w server
	npm run dev

test:
	docker compose up -d --wait db redis
	npm test

# Everything in Docker
up:
	docker compose up --build

server/.env:
	cp server/.env.example server/.env
