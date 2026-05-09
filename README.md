# Brewery Tank Monitor — Tableau Dashboard Extension

Animated brewery fermentation tanks for Tableau dashboards. Each tank shows a live liquid fill level (with a moving wave), temperature-banded color, fermentation stage, ABV, batch ID, and status. Updates automatically when filters / parameters / marks change in Tableau.

**Stack**: React 18 · Vite 5 · D3 v7 · Tailwind 3 · SVG (no canvas, no external chart libs)

**Compatible with**:
- ✅ Tableau Desktop 2018.2+ (Dashboard Extensions API ≥ 1.5)
- ✅ Tableau Desktop **Public Edition** (the free authoring app — what most "Tableau Public" users mean)
- ✅ Tableau Cloud / Server (admin must safe-list the GitHub Pages URL)
- ⚠️ **Tableau Public viewers (the public.tableau.com cloud)**: published workbooks won't render the extension for viewers — Tableau Public only loads **Exchange-sandboxed** extensions. See [Limitations](#known-limitations).

## Folder structure

```
brewery-tank-extension/
├── .github/workflows/deploy.yml         GitHub Actions: build + deploy to Pages
├── public/manifest/
│   ├── brewery-tank-monitor.trex        Tableau manifest (URL placeholder)
│   ├── icon-70.png                      70×70 manifest icon
│   └── icon-70.b64.txt                  Base64 source for the .trex <icon>
├── src/
│   ├── components/
│   │   ├── App.jsx                      top-level layout, header, status orchestration
│   │   ├── TankGrid.jsx                 responsive auto-fit grid of tanks
│   │   ├── Tank.jsx                     SVG tank: shell + animated wave + fill + glow
│   │   ├── Tooltip.jsx                  singleton hover tooltip
│   │   ├── StatusOverlay.jsx            loading / error / empty / mock states
│   │   └── ErrorBoundary.jsx            catches render crashes
│   ├── hooks/
│   │   ├── useTableauData.js            init + subscribe + debounced refresh
│   │   ├── useResizeObserver.js
│   │   └── useDebouncedValue.js
│   ├── services/
│   │   ├── tableau.js                   API wrapper, schema mapping, error codes
│   │   └── mockData.js                  6 mock tanks for standalone preview
│   ├── utils/
│   │   ├── sanitize.js                  XSS-safe text + row sanitization
│   │   ├── colors.js                    temperature bands → colors
│   │   ├── format.js                    number formatters
│   │   └── validation.js                column presence + dedupe
│   ├── styles/index.css                 Tailwind + animation classes
│   └── main.jsx                         React root
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Quick start (local development)

```powershell
cd C:\Users\napaa\Projects\brewery-tank-extension
npm install
npm run dev
```

Opens at `http://127.0.0.1:5173/`. When loaded outside Tableau, it shows 6 **mock tanks** so you can iterate on the UI without firing up the desktop app.

## Production build

```powershell
npm run build      # outputs to dist/
npm run preview    # serves dist/ at http://127.0.0.1:4173/
```

## Deploy to GitHub Pages (full pipeline)

1. **Create a new GitHub repo**, e.g. `brewery-tank-extension`. Push this folder to it.
2. **Enable GitHub Pages**: repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. **Push to `main`**. The workflow at `.github/workflows/deploy.yml` runs automatically:
   - Installs deps, runs `vite build`, copies the `.trex` and icon into `dist/manifest/`
   - Uploads `dist/` as a Pages artifact
   - Publishes to `https://<your-username>.github.io/brewery-tank-extension/`
4. **Edit `public/manifest/brewery-tank-monitor.trex`**: replace `REPLACE_WITH_GITHUB_PAGES_URL` with your actual Pages URL (e.g. `https://napaankur.github.io/brewery-tank-extension`). Commit + push so the live `.trex` (served from `dist/manifest/brewery-tank-monitor.trex`) has the right URL.

> The `.trex` URL must include the trailing `index.html` or end with `/`. Tableau will fail silently if the URL 404s. Open it in a browser first — you should see the mock tanks.

## Tableau setup

### Use it in Tableau Desktop / Tableau Desktop Public Edition

1. Open or create a workbook with a worksheet that has these columns (see **Data model** below).
2. Drag the worksheet into a dashboard.
3. From the dashboard's **Objects** pane, drag **Extension** onto the dashboard.
4. Choose **Access Local Extension** and pick `public/manifest/brewery-tank-monitor.trex` (or download it from your GitHub Pages URL: `https://<username>.github.io/brewery-tank-extension/manifest/brewery-tank-monitor.trex`).
5. Tableau prompts to allow the extension's URL to access data — click **OK**.
6. The tanks render. Apply a filter on the worksheet — the extension auto-refreshes.

### Use it in Tableau Cloud / Server

A site or server admin must add the GitHub Pages URL to the **Trusted extension list** (Server admin → Settings → Extensions → Add URL). Then the steps above work for any author on that site.

## Data model

The extension expects a Tableau worksheet with these columns. Names are matched case-insensitively and tolerate underscores/spaces (e.g. `TankName`, `tank_name`, `Tank Name` all map to the same role).

| Column              | Type     | Required | Notes |
| ------------------- | -------- | -------- | ----- |
| `TankName`          | string   | ✓        | Identifier; duplicates are auto-deduped (`Name (2)`) |
| `FillPercent`       | number   | ✓        | 0–100; controls the liquid level |
| `Temperature`       | number   |          | °C bands: <8 cold (blue), 8-20 normal (green), 20-26 hot (orange), ≥26 critical (red) |
| `ABV`               | number   |          | % alcohol |
| `FermentationStage` | string   |          | Free text (`Active Fermentation`, `Conditioning`, `Cold Crash`, `Packaging Ready`, etc.) |
| `BatchID`           | string   |          | Shown in the footer of each tank card |
| `Status`            | string   |          | `Healthy` / `Warning` / `Critical` shown as a chip; `Critical` adds a blinking glow |

Missing optional columns degrade gracefully — the chart renders with `—` for unmapped fields.

## Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| **Blank iframe** in Tableau | URL in `.trex` 404s, or HTTPS mixed-content | Open the URL in a browser. Pages takes ~1 min after first deploy. |
| **"Tableau Extensions API not loaded"** | Running outside Tableau and the CDN is blocked, or `<script>` tag failed | Check the network tab. The extension still shows mock data; this only matters inside Tableau. |
| **"This extension must be added to a dashboard zone"** | You added the `.trex` to a worksheet's marks card | Drag from **Objects → Extension**, not the marks card. |
| **No data shown / "empty"** | Worksheet filters reduce rows to zero | Adjust filters; try the Refresh button. |
| **Critical glow always on** | Temperature column is in °F, not °C | Either convert in Tableau (`[Temp F] - 32) * 5/9`) or edit `src/utils/colors.js` band thresholds. |
| **Wave animation choppy** | Browser is honoring `prefers-reduced-motion: reduce` | By design — animations are disabled for accessibility. |
| **GitHub Pages 404 on refresh** | Wrong Vite `base` path | We use `base: './'` so it works on any subpath; verify the deploy workflow logs. |
| **CORS error in console** | Hosting on HTTP, or non-HTTPS origin | Pages is HTTPS by default; don't override. Tableau requires HTTPS for non-localhost. |

## Manual test checklist

### Functional
- [ ] Loads on Tableau Desktop with a worksheet containing all 7 columns
- [ ] Loads when columns are partially missing (only TankName + FillPercent → renders with `—` everywhere else)
- [ ] Filter change in Tableau → tanks update within 200 ms
- [ ] Adding/removing a worksheet from the dashboard → extension picks up the change
- [ ] Selecting a different worksheet via the dropdown re-loads data
- [ ] Click Refresh → data re-fetches
- [ ] Standalone (open URL directly in browser) → mock tanks render

### Edge cases
- [ ] Empty result (filter to zero rows) → "No tank data" overlay
- [ ] Null in Temperature → temperature reads `—`, no critical glow
- [ ] Duplicate TankName → second instance suffixed `(2)`
- [ ] Very long name → truncates with ellipsis
- [ ] 100+ tanks → grid scrolls vertically inside the dashboard zone
- [ ] Rapid filter spam → only one re-render after the debounce settles
- [ ] Resize the dashboard zone → tanks reflow without stretching distortion
- [ ] Critical temperature → red glow blinks, status chip in red

### Accessibility
- [ ] Tab through tanks → focus ring visible, screen-reader description present
- [ ] `prefers-reduced-motion: reduce` → no animation, no transitions
- [ ] `prefers-contrast: more` → tanks gain visible borders
- [ ] Keyboard hover focus → tooltip appears at tank's top-center

### Browsers / OS
- [ ] Tableau Desktop on Windows 11
- [ ] Tableau Desktop on macOS
- [ ] Standalone in Chrome/Edge latest
- [ ] Standalone in Firefox latest
- [ ] Standalone in Safari latest

## Known limitations

- **Tableau Public (the cloud at `public.tableau.com`)**: workbooks published there will *not* render this extension for viewers. Tableau Public only allows extensions sandboxed via the Exchange. The local **Tableau Desktop Public Edition** authoring app does run network-hosted extensions (it's just a Chromium iframe with a trust prompt) — that's where your testing happens.
- **Single worksheet at a time**: the dropdown picks one of the dashboard's worksheets. Cross-worksheet aggregation isn't built in.
- **Temperature units**: bands are °C-coded. Convert in Tableau or fork `colors.js` if you need °F.
- **No filter write-back**: this is a read-only viz. Selecting tanks doesn't filter other worksheets (Dashboard Extensions support that via `worksheet.applySelectionAsync` — left out for v1 to keep scope tight).
- **No persistence**: settings (selected worksheet, etc.) reset on every load. Tableau provides `dashboardContent.dashboard.extensions.settings` for persisting — easy to add.

## License

Internal — Disruptive Advantage Pty Ltd. Update this section before open-sourcing.

## Maintainer

Ankur Napa — `ankur.napa@disruptive-advantage.com`
