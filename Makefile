.PHONY: psql scrape reset-db up deploy infra ui setup

psql:
	@export $$(cat .env | grep -v '^#' | xargs) && \
	docker exec -it map-of-anime-postgres \
	psql -U $$POSTGRES_USER -d $$POSTGRES_DB

scrape:
	cd data && python3 scrape.py

reset-db:
	@export $$(cat .env | grep -v '^#' | xargs) && \
	docker cp data/sql/create_tables.sql map-of-anime-postgres:/create_tables.sql && \
	docker cp data/sql/create_views.sql map-of-anime-postgres:/create_views.sql && \
	docker exec -i map-of-anime-postgres \
	psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /create_tables.sql && \
	docker exec -i map-of-anime-postgres \
	psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /create_views.sql

up:
	@export $$(cat .env | grep -v '^#' | xargs) && \
	docker compose up -d

deploy:
	@export $$(cat .env | grep -v '^#' | xargs) && \
	docker compose --profile deploy up -d

infra:
	@export $$(cat .env | grep -v '^#' | xargs) && \
	docker compose --profile infra up -d

ui:
	cd ui && npm start

setup:
	cd data && \
	if [ -d .venv ]; then \
		echo "Activating existing virtual environment"; \
	else \
		echo "Creating new virtual environment"; \
		python3 -m venv .venv; \
	fi && \
	. .venv/bin/activate && \
	pip3 install -r requirements.txt

	cd ../ui && npm install