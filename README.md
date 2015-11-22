# Debian packages source viewer

dpsv is a web application that lets you view sources for Debian
packages online.

As of now, it supports the `main` component of stable, testing,
unstable and experimental.

### Description

dpsv is made up of 4 parts:

- updater
- http
- static
- deleter

#### updater

The updater is a command that will fetch the sources from Debian
servers and build up a local database of them.

#### http

The http server is made up of 2 parts:

- frontend
- api

##### frontend

The frontend is a very simple controller that returns 2 pages: the
search page and the packages page. It is only there to return the
HTML.

##### api

The API is made up of 2 parts:

- search
- packages

###### search

The search API searches through the packages in the local database and
returns all the information stored about them, such as version or
which distribution they belong to.

###### packages

The packages API is responsible for downloading the sources,
extracting them, and returning the contents of the files/folders.

#### static

The static part is mainly 2 scripts executed in the browser. One is
handling the search, the other is handling the packages.

#### deleter

The deleter is a command that deletes extracted folders of sources
that are older than a certain threshold.

### Usage

```
$ npm start # Builds the assets and starts the web server
$ npm run web # Start the web server
$ npm run updater # Run the updater
$ npm run deleter # Run the deleter
$ npm run build # Builds the assets
```

### TODO

- Support .diff.gz
- Add a maintenance mode while the updater is run
- Define and implement API caching
- Refactor to be consistent in usage of HTTP status codes

### License

MIT License.
