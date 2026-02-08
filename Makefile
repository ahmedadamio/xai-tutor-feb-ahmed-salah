SHELL := /bin/bash

BACKEND_DIR := backend
FRONTEND_DIR := frontend
PYTHON ?= python3
BACKEND_VENV := $(BACKEND_DIR)/venv
BACKEND_PYTHON := $(abspath $(BACKEND_VENV)/bin/python)
BACKEND_PIP := $(abspath $(BACKEND_VENV)/bin/pip)
FRONTEND_NEXT_BIN := $(FRONTEND_DIR)/node_modules/.bin/next
NPM_CACHE := $(abspath .npm-cache)
NPM_LOGS := $(abspath .npm-logs)

.PHONY: backend frontend docker-all stop backend-setup frontend-setup dev dev-backend dev-frontend

# Start only the backend service in Docker
backend:
	docker compose up -d api --build

# Start only the frontend service in Docker
frontend:
	docker compose up -d frontend --build

# Start everything (both backend and frontend) in Docker
docker-all:
	docker compose up -d --build

# Stop Docker services
stop:
	docker compose down

# Bootstrap backend dependencies in local venv
backend-setup:
	@set -euo pipefail; \
	if [ ! -x "$(BACKEND_PYTHON)" ]; then \
		echo "Creating backend virtualenv..."; \
		$(PYTHON) -m venv $(BACKEND_VENV); \
	fi; \
	if ! $(BACKEND_PYTHON) -c "import uvicorn" >/dev/null 2>&1; then \
		echo "Installing backend dependencies..."; \
		$(BACKEND_PIP) install -r $(BACKEND_DIR)/requirements.txt; \
	fi

# Bootstrap frontend dependencies
frontend-setup:
	@set -euo pipefail; \
	if [ ! -x "$(FRONTEND_NEXT_BIN)" ]; then \
		echo "Installing frontend dependencies..."; \
		cd $(FRONTEND_DIR) && \
		if [ -f package-lock.json ]; then \
			npm_config_cache=$(NPM_CACHE) npm_config_logs_dir=$(NPM_LOGS) npm ci; \
		else \
			npm_config_cache=$(NPM_CACHE) npm_config_logs_dir=$(NPM_LOGS) npm install; \
		fi; \
	fi

# Run backend locally in dev mode with hot reload
dev-backend: backend-setup
	cd $(BACKEND_DIR) && $(BACKEND_PYTHON) migrate.py upgrade && $(BACKEND_PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend locally in dev mode with hot reload
dev-frontend: frontend-setup
	cd $(FRONTEND_DIR) && npm run dev

# Run backend + frontend locally in dev mode with hot reload
dev: backend-setup frontend-setup
	@set -euo pipefail; \
	trap 'kill 0' EXIT INT TERM; \
	( cd $(BACKEND_DIR) && $(BACKEND_PYTHON) migrate.py upgrade && $(BACKEND_PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 ) & \
	( cd $(FRONTEND_DIR) && npm run dev ) & \
	wait
