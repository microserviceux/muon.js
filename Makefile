
clean:
	rm -rf dist
	rm -f test/server/generated.js

muonjs: clean
	mkdir -p dist/
	browserify test/server/app.js -o test/server/generated.js

run: muonjs
	npm run dev

publish:
	npm publish