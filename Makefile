
all: run

build:
	yarn
	tsc

clean:
	rm -rf dist
	rm -rf browserdist
	rm -f test/server/muon.js

muonjs: clean build
	mkdir browserdist
	./node_modules/browserify/bin/cmd.js -r muon-core -r jquery -r json-markup -r ./dist/MuonClient.js:muonjs > ./browserdist/muon.js
	#./node_modules/minifier/index.js --output ./browserdist/muon.min.js ./browserdist/muon.js
	cp browserdist/muon.js test/server/muon.min.js

run: muonjs
	yarn dev

publish:
ifndef VERSION
	$(error VERSION is undefined for NPM release)
endif
	yarn
	npm version --no-git-tag-version $(VERSION)
	npm publish

publish-snapshot:
	yarn
	yarn build
	npm version --no-git-tag-version prerelease
	npm publish --tag next
	git add package.json
	git commit -m "Update snapshot version"
	git push origin
