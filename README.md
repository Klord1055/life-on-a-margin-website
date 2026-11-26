# Life on a Margin

**You can beat the market. You can't beat time.**

Life on a Margin is an open-world financial career and life simulation RPG in development by Klord Fernandez Cayetano. This repository contains its public website.

| Edition | Intended distribution | Status |
| --- | --- | --- |
| Life on a Margin: The First Trade | Free browser demo | In development |
| Life on a Margin | Downloadable game, with Windows as the first target | In development |

The website includes an overview, release status, a searchable getting-started guide, dated development updates and site help. Search runs in the browser, and all guide topics remain readable when JavaScript is disabled. The Financial Academy has three fictional worked examples with further reading from the SEC and Investor.gov. Its artwork is original concept art. Gameplay media and release links will be added after verification.

## Local preview

Run `python3 -m http.server 8000` in this directory and visit `http://localhost:8000/`. The site uses HTML, CSS, a small search script and a local image. It does not need a build command.

## Website checks

From the website directory, run the Python smoke tests and the browser suite:

```sh
python3 tests/smoke_test.py
npm ci
npx playwright install chromium
npm test
```

The browser suite checks an actual site preview at desktop, tablet and narrow mobile sizes. It exercises navigation, update and help links, guide search with and without JavaScript, keyboard disclosures, release copy, asset loading, page width and an automated axe scan. For another Chromium installation, set `CHROMIUM_PATH` to its executable or `PLAYWRIGHT_CHANNEL` to its named Playwright channel. Set `PYTHON` to override the local preview server's Python executable.

Set `WEBSITE_URL` to the deployed base URL to run the same browser checks against a deployment without starting a local server. These checks describe the prerelease website. Released builds, public distribution links, and full cross-browser and manual accessibility validation require separate checks.
