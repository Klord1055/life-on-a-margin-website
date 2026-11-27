# Life on a Margin

**You can beat the market. You can't beat time.**

Life on a Margin is an open-world financial career and life simulation RPG in development by Klord Fernandez Cayetano. This repository contains its public website.

| Edition | Intended distribution | Status |
| --- | --- | --- |
| Life on a Margin: The First Trade | Free browser demo | In development |
| Life on a Margin | Downloadable game, with Windows as the first target | In development |

The website includes an interactive Chicago district showcase, dedicated pages for both editions, a searchable getting-started guide, dated development updates and site help. The concept illustration in the homepage hero is labeled separately from the screenshots of the shared development build. Only cropped, rendered game imagery is stored in `assets/gameplay/`. The edition pages distinguish development plans from verified internal results and current release status. Both district captures and every guide topic remain readable when JavaScript is disabled. The Financial Academy has three fictional worked examples with further reading from the SEC and Investor.gov.

The Academy also compares the cash cost of ordering by the unit and buying a bulk lot. The comparison runs in the browser, in integer cents, with a worked example for visitors using the site without JavaScript.

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

The browser suite checks an actual site preview at desktop, tablet and narrow mobile sizes. It exercises navigation, edition pages and their release links, update and help links, guide search with and without JavaScript, keyboard disclosures, release copy, asset loading, page width and automated axe scans. For another Chromium installation, set `CHROMIUM_PATH` to its executable or `PLAYWRIGHT_CHANNEL` to its named Playwright channel. Set `PYTHON` to override the local preview server's Python executable.

Set `WEBSITE_URL` to the deployed base URL to run the same browser checks against a deployment without starting a local server. These checks describe the prerelease website. Released builds, public distribution links, and full cross-browser and manual accessibility validation require separate checks.
