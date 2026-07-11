.PHONY: dev dev-backend dev-frontend build build-backend build-frontend deploy clean

dev:
	@echo "Starting backend & frontend in parallel..."
	(cd backend && mvn spring-boot:run -pl edms-boot) &
	(cd frontend && pnpm dev)
	wait

dev-backend:
	cd backend && mvn spring-boot:run -pl edms-boot

dev-frontend:
	cd frontend && pnpm dev

build:
	cd backend && mvn clean install -T 4 -Pcloud
	cd frontend && pnpm build

deploy:
	docker compose -f deploy/docker-compose.yml up -d

clean:
	cd backend && mvn clean
	cd frontend && pnpm clean
