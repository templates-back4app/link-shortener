// Stack: Node.js 22.x | Parse Server 8.x | File: cloud/main.js
// Runs inside the backend, not the container: the container can be
// redeployed, scaled or replaced and these rules still hold.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

Parse.Cloud.beforeSave("Link", async (request) => {
  const link = request.object;
  if (!link.isNew()) return; // updates (click counts) pass through untouched

  let url;
  try { url = new URL(link.get("url")); } catch { url = null; }
  if (!url || !["http:", "https:"].includes(url.protocol)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "url must be an http(s) URL.");
  }
  link.set("url", url.toString());
  link.set("clicks", 0);

  // assign a short code that no other Link uses
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = code();
    const taken = await new Parse.Query("Link").equalTo("code", candidate).first({ useMasterKey: true });
    if (!taken) { link.set("code", candidate); return; }
  }
  throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, "could not allocate a short code.");
});
