import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();

// ------------------------------------------------------------------
// 1. Read the Vite client manifest to find the entry JS + CSS files
// ------------------------------------------------------------------
const manifestPath = resolve(projectRoot, "dist/client/.vite/manifest.json");
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
} catch (err) {
  console.error("Could not read Vite manifest at", manifestPath);
  console.error(err?.message ?? String(err));
  process.exit(1);
}

const entryChunk = Object.values(manifest).find((chunk) => chunk?.isEntry);
if (!entryChunk) {
  console.error("No isEntry chunk found in manifest.");
  process.exit(1);
}

const entryHref = `/${entryChunk.file}`;
console.log("Entry JS:", entryHref);

const allCss = new Set();
for (const chunk of Object.values(manifest)) {
  if (chunk?.file?.endsWith(".css")) allCss.add(`/${chunk.file}`);
  (chunk?.css ?? []).forEach((f) => allCss.add(`/${f}`));
}

const cssLinks = [...allCss]
  .map((href) => `  <link rel="stylesheet" href="${href}"/>`)
  .join("\n");

// ------------------------------------------------------------------
// 2. TanStack Router hydrate() expects window.$_TSR to exist.
//    Inject a minimal bootstrap so client render works with no SSR.
// ------------------------------------------------------------------
const tsrBootstrap = `<script>
(self['$R']=self['$R']||{})['tsr']=[];
self['$_TSR']={
  h:function(){this.hydrated=true;this.c();},
  e:function(){this.streamEnded=true;this.c();},
  c:function(){if(this.hydrated&&this.streamEnded){delete self['$_TSR'];delete self['$R'].tsr;}},
  p:function(fn){this.initialized?fn():this.buffer.push(fn);},
  buffer:[],initialized:false
};
window['$_TSR'].router={manifest:{routes:{}},matches:[],lastMatchId:''};
window['$_TSR'].e();
</script>`;

// ------------------------------------------------------------------
// 3. Write the SPA shell
// ------------------------------------------------------------------
const spaHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>QOBOX — Invoicing, Billing, Accounting</title>
  <meta name="description" content="Manage all your businesses, GST profiles and books in one place."/>
  <link rel="icon" type="image/png" href="/favicon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"/>
${cssLinks}
</head>
<body>
${tsrBootstrap}
  <script type="module">import("${entryHref}")</script>
</body>
</html>
`;

await writeFile(resolve(projectRoot, "dist/client/index.html"), spaHtml);
console.log("Generated dist/client/index.html (" + spaHtml.length + " bytes)");

