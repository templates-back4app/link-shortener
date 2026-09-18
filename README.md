# link-shortener

**A Node.js link shortener deployed from a Dockerfile, live with a database in 42 seconds and no server to run.** 42 lines of Express in a container, with the data, the URL validation and the short-code generation in a managed [Back4app](https://www.back4app.com/) backend. Nothing to provision, patch or back up.

Measured on September 10, 2026, on Back4app Containers: Deploy click → first `200` in **42 s** (29 s of it the image build), redeploys in 14–32 s with zero failed requests during the swap. Every number in the article comes from this exact code.

> Read the article: *How to Deploy a Node.js App From a Dockerfile — With a Database and Auth, No Servers to Manage* — link added at publication.

## What it does

`server.js`: a page, `POST /shorten` that creates a `Link` object in the backend through the Parse JS SDK, and `GET /:code` that looks it up and redirects. The backend owns the rules: a 19-line Cloud Code hook (`cloud/main.js`) validates the URL, sets `clicks` to 0 and allocates a short code that no other Link uses, whichever client sent the request.

```
browser ──▶ ┌────────────────────────┐        ┌──────────────────────┐
            │ container (node:22)    │ ─SDK──▶│ Back4app backend      │
            │ POST /shorten · GET /:c│        │ Link + beforeSave     │
            └────────────────────────┘        └──────────────────────┘
```

## What we measured

| Measurement | Result |
|---|---|
| Deploy click → first `200` (first deploy) | 42 s (29 s of it the image build) |
| Image | 64.6 MB compressed, 8 layers |
| Redeploys with a one-line change | 14 s, 20 s, 32 s, 20 s — zero failed requests during the swaps |

Findings from the run: a wrong port is not an error (the platform logged *App is not listening on port 8080, but on port 3000 — switching to it*); the proxy terminates TLS but does not forward the scheme (`req.protocol` is `http`, build public URLs with `https` yourself); and since September 15, 2026 a free container's URL lives 60 minutes per deploy.

## Files

- `server.js` — the container.
- `cloud/main.js` — the backend rule, deployed as Cloud Code (`beforeSave("Link")`).
- `Dockerfile` — 8 lines, `node:22-alpine`.
- `deploy-check.sh` — verifies a deployment end to end.

## Deploy your own

1. **Create a free account.** Sign up at [https://www.back4app.com/signup](https://www.back4app.com/signup). One account gives you both halves: **Build your Backend** (the database and rules) and **Containers** (where the Dockerfile runs).
2. **Backend:** New App → Build your Backend. On Overview copy the App ID and the JavaScript key. **Cloud Code → main.js**: paste `cloud/main.js`, Deploy, then edit and deploy again (the first deploy on a fresh backend ships nothing); prove the hook with a request.
3. **Container:** push this repo to GitHub, then **Containers → New App → Deploy from GitHub**. Set `PARSE_APP_ID` and `PARSE_JS_KEY` as environment variables and the health check to `/healthz`. Deploy.
4. Verify: `./deploy-check.sh https://<your-app>.b4a.run`

On the free plan the container's URL lives 60 minutes per deploy, enough to test everything here. For a permanent URL change the plan (Shared starts at $5/month as of September 2026).

## Run locally

```bash
cp .env.example .env      # PARSE_APP_ID, PARSE_JS_KEY
npm install               # pins parse@8 — on Node 25, an unpinned install silently gets parse@3.5.1
node --env-file=.env server.js
```

## What the platform gives you

Containers build the Dockerfile, run the image behind HTTPS on a public URL and redeploy on push. The backend is a managed Parse Server with a database, REST and GraphQL APIs, Cloud Code and a dashboard. Documentation: [https://www.back4app.com/docs-containers](https://www.back4app.com/docs-containers) · [https://www.back4app.com/docs](https://www.back4app.com/docs).

## License

MIT
