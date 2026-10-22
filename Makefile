.DEFAULT_GOAL := help
.PHONY: help test-api test-e2e test-all test-api-finding typecheck test-load-smoke test-load

HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)
BOOKER_ENV_FILE ?= .env.example

help:
	@printf '%s\n' \
	  'make help              Exibe os comandos disponíveis' \
	  'make test-api          Ruff e regressão API, sem quality_finding' \
	  'make test-e2e          Checkout seguro no Docker (@checkout-safe)' \
	  'make test-all          Executa API e E2E e informa ambos os resultados' \
	  'make test-api-finding  Executa API-001 com resultado real' \
	  'make typecheck         Instala dependências web e valida TypeScript' \
	  'make test-load-smoke   API mock local: 10 VUs por 15 segundos' \
	  'make test-load         API mock local: 500 VUs por 5 minutos'

test-api:
	uv sync --locked --dev
	uv run --locked ruff check api
	mkdir -p reports/api-regression
	uv run --locked --env-file "$(BOOKER_ENV_FILE)" pytest api/tests -m "not quality_finding" -v \
	  --html=reports/api-regression/report.html --self-contained-html \
	  --junitxml=reports/api-regression/junit.xml

test-e2e:
	@docker info --format '{{.OSType}}' 2>/dev/null | grep -qx linux || { \
	  printf '%s\n' 'Docker Linux indisponível. Inicie o Docker Engine e confira: docker info'; \
	  exit 1; \
	}
	docker build -t quality-challenge-e2e:local web
	mkdir -p reports
	docker run --rm --ipc=host \
	  --user "$(HOST_UID):$(HOST_GID)" -e HOME=/tmp -e WEB_BASE_URL \
	  -v "$(CURDIR)/reports:/workspace/reports" \
	  quality-challenge-e2e:local \
	  npm test -- --tags @checkout-safe

test-all:
	@$(MAKE) --no-print-directory test-api; api_status=$$?; \
	  $(MAKE) --no-print-directory test-e2e; e2e_status=$$?; \
	  printf 'test-api: %s | test-e2e: %s\n' "$$api_status" "$$e2e_status"; \
	  if [ "$$api_status" -ne 0 ]; then exit "$$api_status"; fi; \
	  exit "$$e2e_status"

test-api-finding:
	uv sync --locked --dev
	mkdir -p reports/api-quality-findings
	uv run --locked --env-file "$(BOOKER_ENV_FILE)" pytest \
	  api/tests/test_required_fields_negative.py::test_post_rejects_missing_firstname -v \
	  --html=reports/api-quality-findings/report.html --self-contained-html \
	  --junitxml=reports/api-quality-findings/junit.xml

typecheck:
	cd web && npm ci --no-audit --no-fund
	cd web && npx tsc --noEmit

test-load-smoke:
	bash performance/run-load.sh smoke

test-load:
	bash performance/run-load.sh load
