.PHONY: setup build dev up down lint

setup:
	npm install

build:
	npm run build

dev:
	npm run dev

up:
	docker-compose up -d

down:
	docker-compose down

lint:
	npm run lint
