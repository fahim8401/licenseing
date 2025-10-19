.PHONY: help up down logs migrate seed install-deps build test lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services with Docker Compose
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs from all services
	docker-compose logs -f

migrate: ## Run database migrations
	docker-compose exec api npm run migrate

seed: ## Seed the database with sample data
	docker-compose exec api npm run seed

install-deps: ## Install dependencies for backend and frontend
	cd backend && npm install
	cd frontend && npm install

build: ## Build backend and frontend
	cd backend && npm run build
	cd frontend && npm run build

test: ## Run tests
	cd backend && npm test

lint: ## Run linters
	cd backend && npm run lint
	cd frontend && npm run lint

dev-backend: ## Run backend in development mode
	cd backend && npm run dev

dev-frontend: ## Run frontend in development mode
	cd frontend && npm run dev

build-installer: ## Build Go installer
	cd installer/go && go build -o ../installer main.go
