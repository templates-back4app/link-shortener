# link-shortener

A link shortener in a Docker container that stores its data in a Back4app backend — the companion project for the Back4app blog post on deploying a Node.js app from a Dockerfile with a database and auth, without managing servers.

- `server.js` — the container: a page, `POST /shorten`, `GET /:code` redirect.
- `cloud/main.js` — the backend: validation and short-code generation, deployed as Cloud Code.
- `Dockerfile` — 8 lines, `node:22-alpine`.
- `deploy-check.sh` — verifies a deployment end to end.

## Run locally

    cp .env.example .env   # fill in your App ID and JavaScript key
    npm install
    node --env-file=.env server.js

## Deploy

Push to GitHub → Back4app Containers → Deploy from GitHub → set `PARSE_APP_ID` and `PARSE_JS_KEY` as environment variables → deploy. The blog post walks through it with timings and screenshots.
