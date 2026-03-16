.PHONY: dev build clean install

dev:
	./start.sh

build:
	cd build && bash build.sh

clean:
	rm -rf build/dist build/build frontend/dist

install: build
	cp -r build/dist/SkillDeck.app /Applications/
	@echo "Installed to /Applications/SkillDeck.app"
