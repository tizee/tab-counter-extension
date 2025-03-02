.PHONY: clean firefox chrome install-deps

all: install-deps firefox chrome

install-deps:
	pnpm install

firefox:
	pnpm run build:firefox

chrome:
	pnpm run build:chrome

clean:
	rm -rf ./dist ./dist-firefox ./dist-chrome
