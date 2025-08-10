VERSION ?= 1.0

# Backend Server
build:	
	docker build -t ghcr.io/dilan/nasa-backend:$(VERSION) .

run:
	docker run -p 4200:4200 -d --name nasa-backend ghcr.io/dilan/nasa-backend:$(VERSION)

build-and-push:	
	docker buildx build --platform linux/amd64 -t ghcr.io/dilan/nasa-backend:$(VERSION) --push .

pull:
	docker pull ghcr.io/dilan/nasa-backend:$(VERSION)
