
clean:
	rm -rf dist
	rm test/server/muon.js

muonjs: clean
	mkdir -p dist/
	browserify src/index.js -o dist/muon.js
	ln -s dist/muon.js test/server/muon.js