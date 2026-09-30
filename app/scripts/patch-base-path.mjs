import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_PATH = process.env.CANOPY_BASE_PATH || '';

// ── 1. Patch hardcoded API paths in canopy-custom-components.js ──────────────
//    Only needed when deploying under a sub-path.

if (BASE_PATH) {
  const jsFile = join(process.cwd(), 'site', 'scripts', 'canopy-custom-components.js');
  let src = readFileSync(jsFile, 'utf8');

  const jsReplacements = [
    [/fetch\("\/api\/navplace\.json"\)/g,        `fetch("${BASE_PATH}/api/navplace.json")`],
    [/fetch\("\/api\/search-records\.json"\)/g,  `fetch("${BASE_PATH}/api/search-records.json")`],
    [/fetch\("\/api\/search-index\.json"\)/g,    `fetch("${BASE_PATH}/api/search-index.json")`],
    [/h\.href="\/scripts\/canopy-map\.css"/g,    `h.href="${BASE_PATH}/scripts/canopy-map.css"`],
  ];

  let jsCount = 0;
  for (const [pattern, replacement] of jsReplacements) {
    const before = src;
    src = src.replace(pattern, replacement);
    if (src !== before) jsCount++;
  }
  writeFileSync(jsFile, src);
  console.log(`[patch] Patched ${jsCount} hardcoded path(s) in canopy-custom-components.js with base path "${BASE_PATH}".`);

  // ── Fix double base-path application in canopy-search-form.js ────────────────
  // The canopy package's withBase()/L() function is called twice on every search
  // result href: once in loadRecords() and again in renderList(). Without an
  // idempotency guard, a second call doubles the base path segment
  // (e.g. /aggieland-through-time/aggieland-through-time/works/...).
  // We add the guard here because the runtime JS ships without it.
  const sfFile = join(process.cwd(), 'site', 'scripts', 'canopy-search-form.js');
  let sfSrc = readFileSync(sfFile, 'utf8');
  const SF_OLD = 'if(/^https?:/i.test(n))return n;let d=n.replace(/^\\/+/,"");return`${l}/${d}`';
  const SF_NEW = 'if(/^https?:/i.test(n))return n;if(n===l||n.startsWith(l+"/"))return n;let d=n.replace(/^\\/+/,"");return`${l}/${d}`';
  const sfPatched = sfSrc.split(SF_OLD).join(SF_NEW);
  const sfFixed = sfPatched !== sfSrc;
  writeFileSync(sfFile, sfPatched);
  console.log(sfFixed
    ? '[patch] Fixed withBase() idempotency in canopy-search-form.js (prevents doubled base path in typeahead).'
    : '[patch] WARNING: could not locate withBase() pattern in canopy-search-form.js — typeahead URLs may be doubled.');
} else {
  console.log('[patch] No CANOPY_BASE_PATH set — skipping JS path patch (dev mode).');
}
