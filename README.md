# link-shortener

**A link shortener in a Docker container that keeps its data, validation and short-code generation in a managed Back4app backend — deployed from a Dockerfile with no server and no database to run.**

This is the companion repository for the Back4app blog post *How to Deploy a Node.js App From a Dockerfile — With a Database and Auth, No Servers to Manage*. Everything in the post was measured on this exact code, on September 10, 2026.

> Article: link added at publication.

## What it does

42 lines of Express (`server.js`): a page, `POST /shorten` that creates a `Link` object in the backend through the Parse JS SDK, and `GET /:code` that looks it up and redirects. The backend owns the rules: a 19-line Cloud Code hook (`cloud/main.js`) validates the URL, sets `clicks` to 0 and allocates a short code that no other Link uses.

```
browser ──▶ ┌────────────────────────┐        ┌──────────────────────┐
            │ container (node:22)    │ ─SDK──▶│ Back4app backend      │
            │ POST /shorten · GET /:c│        │ Link + beforeSave     │
            └────────────────────────┘        └──────────────────────┘
```

## What we measured (September 2026, Back4app Containers)

| Measurement | Result |
|---|---|
| Deploy click → first `200` (first deploy) | 42 s (29 s of it the image build) |
| Image | 64.6 MB compressed, 8 layers |
| Redeploys with a one-line change | 14 s, 20 s, 32 s, 20 s — zero failed requests during the swaps |

Findings from the run: a wrong port is not an error (the platform logged *App is not listening on port 8080, but on port 3000 — switching to it*), the proxy terminates TLS but does not forward the scheme (`req.protocol` is `http`; build public URLs with `https` yourself), and since September 15, 2026 a free container's URL lives 60 minutes per deploy.

## Files

- `server.js` — the container.
- `cloud/main.js` — the backend rule, deployed as Cloud Code (`beforeSave("Link")`).
- `Dockerfile` — 8 lines, `node:22-alpine`.
- `deploy-check.sh` — verifies a deployment end to end.

## Run locally

```bash
cp .env.example .env      # PARSE_APP_ID, PARSE_JS_KEY
npm install               # pins parse@8 — on Node 25, an unpinned install silently gets parse@3.5.1
node --env-file=.env server.js
```

## Deploy

1. Create a Back4app backend app; paste `cloud/main.js` into **Cloud Code → main.js** and deploy — twice: the first deploy on a fresh backend ships nothing, so prove the hook with a request.
2. Push this repo to GitHub, then **Back4app Containers → New App → Deploy from GitHub**.
3. Set `PARSE_APP_ID` and `PARSE_JS_KEY`; set the health check to `/healthz`; deploy.
4. Verify: `./deploy-check.sh https://<your-app>.b4a.run`

## License

MIT
