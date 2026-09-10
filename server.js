// Stack: Node.js 22.x | Express 5.x + Parse JS SDK | File: server.js
// The container does exactly two things: serve a page and talk to the backend.
// Validation, short-code generation and uniqueness live in cloud/main.js.
const express = require("express");
const Parse = require("parse/node");

const {
  PORT = 8080,
  PARSE_APP_ID,
  PARSE_JS_KEY,
  PARSE_SERVER_URL = "https://parseapi.back4app.com",
} = process.env;

Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
Parse.serverURL = PARSE_SERVER_URL;

const app = express();
app.set("trust proxy", true); // behind Back4app's TLS-terminating proxy: req.protocol becomes https
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const page = (body) => `<!doctype html><meta charset="utf-8"><title>Link shortener</title>
<style>body{font:16px system-ui;max-width:520px;margin:60px auto;padding:0 20px}input{width:100%;padding:10px;font-size:16px}button{margin-top:10px;padding:10px 16px;font-size:16px}code{font-size:18px}</style>
<h1>Link shortener</h1>${body}`;

const form = `<form method="post" action="/shorten"><input name="url" placeholder="https://example.com/a/very/long/path" required autofocus><button>Shorten</button></form>`;

app.get("/", (req, res) => res.send(page(form)));

app.get("/healthz", (req, res) => res.json({ ok: true, version: require("./package.json").version }));

app.post("/shorten", async (req, res) => {
  try {
    const link = new Parse.Object("Link");
    link.set("url", String(req.body.url ?? ""));
    const saved = await link.save(); // beforeSave in the backend validates and assigns the code
    const short = `${req.protocol}://${req.get("host")}/${saved.get("code")}`;
    if (req.is("json")) return res.status(201).json({ code: saved.get("code"), short, url: saved.get("url") });
    res.send(page(`<p>Short link: <a href="${short}"><code>${short}</code></a></p><p><a href="/">Shorten another</a></p>`));
  } catch (err) {
    const status = err.code === Parse.Error.VALIDATION_ERROR ? 400 : 502;
    if (req.is("json")) return res.status(status).json({ code: err.code, error: err.message });
    res.status(status).send(page(`<p>${err.message}</p><p><a href="/">Try again</a></p>`));
  }
});

app.get("/:code", async (req, res) => {
  const link = await new Parse.Query("Link").equalTo("code", req.params.code).first();
  if (!link) return res.status(404).send(page("<p>No such link.</p>"));
  link.increment("clicks");
  link.save().catch(() => {}); // best effort; never delays the redirect
  res.redirect(302, link.get("url"));
});

app.listen(PORT, () => console.log(`link-shortener listening on ${PORT}`));
