
all: clean muonjs

build:
	npm install

clean:
	rm -rf dist
	rm -f test/server/generated.js

muonjs: clean
	./node_modules/browserify/bin/cmd.js test/server/app.js -o test/server/generated.js

run: muonjs
	npm run dev

publish:
	npm publish
