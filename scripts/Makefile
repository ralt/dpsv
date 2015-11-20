BROWSERIFY=../node_modules/.bin/browserify -d
UGLIFY=../node_modules/.bin/uglifyjs2 -mc

SHARED_SOURCES=$(wildcard shared/*.js)
SEARCH_SOURCES=$(wildcard search/*.js)
PACKAGES_SOURCES=$(wildcard packages/*.js)

all: ../static/search.js ../static/packages.js

.PHONY: clean

clean:
	@rm -f ../static/search.js ../static/packages.js

../static/search.js: $(SEARCH_SOURCES) $(SHARED_SOURCES)
	$(BROWSERIFY) search/index.js | $(UGLIFY) > $@

../static/packages.js: $(PACKAGES_SOURCES) $(SHARED_SOURCES)
	$(BROWSERIFY) packages/index.js | $(UGLIFY) > $@
