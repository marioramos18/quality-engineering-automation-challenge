.DEFAULT_GOAL := help
PYTHON ?= python3
.PHONY: help test-api test-e2e test-regression test-all test-api-finding typecheck test-load-smoke test-load test-mobile

help:
	@echo make help              Exibe os comandos disponíveis
	@echo make test-api          Ruff e regressao API
	@echo make test-e2e          Suite Web privada completa
	@echo make test-regression   API e E2E, informa ambos os resultados
	@echo make test-all          API, E2E, carga e mobile
	@echo make test-api-finding  API-001, falha conhecida preservada
	@echo make typecheck         Instala dependencias Web e valida TypeScript
	@echo make test-load-smoke   API mock local: 10 VUs por 15 segundos
	@echo make test-load         API mock local: 500 VUs por 5 minutos
	@echo make test-mobile       Android preparado, Appium e APK verificado

test-api:
	$(PYTHON) scripts/run_api.py

test-e2e:
	$(PYTHON) scripts/run_e2e.py

test-regression:
	$(PYTHON) scripts/run_all.py regression

test-all:
	$(PYTHON) scripts/run_all.py all

test-api-finding:
	$(PYTHON) scripts/run_api.py --finding

typecheck:
	cd web && npm ci --no-audit --no-fund
	cd web && npx tsc --noEmit

test-load-smoke:
	$(PYTHON) scripts/run_load.py smoke

test-load:
	$(PYTHON) scripts/run_load.py load

test-mobile:
	bash .github/scripts/mobile-ci.sh
