# DentNow — developer entry points. Full CI-equivalent targets land in Task 22.
.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help secrets config up down infra-test frontend-check backend-check

help: ## Show available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

secrets: ## Generate .secrets/* (idempotent; use --rotate to regenerate)
	./ops/init-secrets.sh

config: ## Validate the Compose file
	docker compose config --quiet && echo "compose OK"

up: secrets ## Start the full stack on this host (build + detach)
	docker compose up --build -d

down: ## Stop the stack (keep volumes)
	docker compose down

infra-test: ## Bring up the infra + init one-shots from a single `up`, then smoke-test
	./ops/init-secrets.sh
	docker compose up -d --wait postgres-init minio-init keycloak-config
	bash backend/tests/compose/test_infrastructure.sh

frontend-check: ## Frontend typecheck + unit tests + lint + build
	npm --prefix frontend ci
	npm --prefix frontend run typecheck
	npm --prefix frontend run test -- --run
	npm --prefix frontend run lint
	npm --prefix frontend run build

backend-check: ## Backend contract/unit tests (requires backend/.venv)
	PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/contract backend/tests/unit -q
