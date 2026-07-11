const fs = require("fs");
const t = fs.readFileSync(".env.local", "utf8");
function get(name) {
  const m = t.match(new RegExp("^\\s*" + name + "\\s*=\\s*(.*)$", "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
let host = "bad";
try {
  host = new URL(url).host;
} catch {}
const urlOk =
  Boolean(url) &&
  !url.includes("your-project-ref") &&
  url.startsWith("https://");
const keyOk = Boolean(key) && key !== "your-anon-key" && key.length > 20;
console.log("URL_OK=" + urlOk);
console.log("KEY_OK=" + keyOk);
console.log("URL_HOST=" + host);
console.log("KEY_LEN=" + key.length);
