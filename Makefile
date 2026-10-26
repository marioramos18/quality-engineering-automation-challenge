.DEFAULT_GOAL := help
.PHONY: help test-api test-e2e test-all test-api-finding typecheck test-load-smoke test-load

help:
	@printf '%s\n' \
	  'make help              Exibe os comandos disponíveis' \
	  'make test-api          Ruff e regressão API, sem quality_finding' \
	  'make test-e2e          Suíte completa em Toolshop isolado e descartável' \
	  'make test-all          Executa API e E2E e informa ambos os resultados' \
	  'make test-api-finding  Executa API-001 com resultado real' \
	  'make typecheck         Instala dependências web e valida TypeScript' \
	  'make test-load-smoke   API mock local: 10 VUs por 15 segundos' \
	  'make test-load         API mock local: 500 VUs por 5 minutos'

test-api:
	python3 scripts/run_api.py

test-e2e:
	python3 scripts/run_e2e.py

test-all:
	@$(MAKE) --no-print-directory test-api; api_status=$$?; \
	  $(MAKE) --no-print-directory test-e2e; e2e_status=$$?; \
	  printf 'test-api: %s | test-e2e: %s\n' "$$api_status" "$$e2e_status"; \
	  if [ "$$api_status" -ne 0 ]; then exit "$$api_status"; fi; \
	  exit "$$e2e_status"

test-api-finding:
	python3 scripts/run_api.py --finding

typecheck:
	cd web && npm ci --no-audit --no-fund
	cd web && npx tsc --noEmit

test-load-smoke:
	python3 scripts/run_load.py smoke

test-load:
	python3 scripts/run_load.py load
