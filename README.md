# eservicesredp-scrapper

A small Puppeteer pipeline that collects brokerage licence listings from a Saudi government e-services query page and exports them to CSV.

**Status:** Stub. The project has three real source files (a link collector, a detail scraper and a CSV cleanup script). The code chains them into a working pipeline, but it is too small to count as a finished tool, and nothing in it is deployed.

## The problem

The scripts target the brokerage query page on the REGA e-services site. They walk its paginated search results, open each listing, and turn the label/value detail blocks into a flat table, so the listings can be read and filtered in a spreadsheet.

## What it does

- **Collects listing links** (`index.js`): opens the brokerage query page in a visible browser, selects fixed dropdown filters for four city IDs, and clicks through every results page, saving each listing URL to `newLinks.json`.
- **Scrapes listing details** (`scrape.js`): visits each saved URL in a headless browser and reads the `.groupItemShow` label/value pairs from the `.blockForm` sections.
- **Exports CSV** (`scrape.js`): writes the collected records to `data.csv` with `json-2-csv`.
- **Cleans the export** (`cleanup/cleanup.js`): drops any record that has an empty or `"undefined"` field and writes `cleanedData.csv`.

## How it's built

- Node.js with ES modules (`"type": "module"`), no framework.
- Puppeteer 23 for browser automation. The collector runs with `headless: false` so it can be watched; the detail scraper runs headless.
- `json-2-csv` for export, and `csv-parse` in the cleanup step.
- Each stage hands off to the next through a file on disk (`newLinks.json`, then `data.csv`, then `cleanedData.csv`). Each stage can be re-run on its own, and the output of one can be inspected before the next runs.
- Selectors are hard-coded CSS class names copied from the target site, and city IDs are hard-coded in an array. Both are tied to the site's current markup.

## Running it locally

The lockfile is pnpm's, so install with pnpm:

```
pnpm install
pnpm dev
```

`pnpm dev` runs `node index.js`, which collects the listing links into `newLinks.json`. The other two steps have no npm script yet. Run them with `node scrape.js` from the repo root, then `node cleanup/cleanup.js` from inside `cleanup/`, because that script reads `data.csv` from the current directory.

## What's left

- No tests. The `test` script in `cleanup/package.json` is the npm placeholder.
- `scrape.js` and `cleanup/cleanup.js` are not wired into the root `package.json` scripts.
- `index.js` appends to `newLinks.json` without de-duplicating, so running it twice stores duplicate links.
- City IDs and the dropdown indexes are hard-coded. A change to the site's filter order or class names will break the selectors without any error handling beyond a logged message.
- `index.js` has `browser.close()` commented out, and it has no summary of how many listings were found or skipped.
- The committed `cleanup/data.csv` and `cleanup/cleanedData.csv` contain personal contact details of individuals. They should be removed from the repository and its history, and the output files should be kept out of git.
- The `public/fonts/README.md` file refers to an unrelated "Blockchain Explorer" app and is left over from a template.
