
all: run

build:
	npm install

clean: build
	rm -rf dist
	rm -f test/server/muon.js
	rm -f src/muon.js
	rm -f src/muon.min.js

muonjs: clean
	./node_modules/browserify/bin/cmd.js -r ./src/index.js:muon-core > ./src/muon.js
	 ./node_modules/minifier/index.js --output ./src/muon.min.js ./src/muon.js 
	./node_modules/browserify/bin/cmd.js -r jquery -r json-markup -r ./src/index.js:muon-core > ./test/server/muon.js

run: muonjs
	npm run dev

publish:
	npm publish
