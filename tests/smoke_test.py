"""Check the self-contained prerelease pages with Python's standard library."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import unittest

ROOT = Path(__file__).resolve().parents[1]
EDITION_PAGES = ("editions/first-trade.html", "editions/life-on-a-margin.html")
READING_SOURCES = {
    "https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements",
    "https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator",
    "https://www.investor.gov/introduction-investing/investing-basics/glossary/diversification",
}


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []
        self.assets = []
        self.headings = []
        self.details = 0
        self.summaries = 0
        self.images = []
        self.update_dates = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a":
            self.links.append(attrs.get("href"))
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.assets.append(attrs["href"])
        if tag == "script" and "src" in attrs:
            self.assets.append(attrs["src"])
        if tag == "img":
            self.assets.append(attrs["src"])
            self.images.append(attrs)
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.headings.append(int(tag[1]))
        if tag == "details":
            self.details += 1
        if tag == "summary":
            self.summaries += 1
        if tag == "time":
            self.update_dates.append(attrs.get("datetime"))


class SiteSmokeTest(unittest.TestCase):
    def setUp(self):
        self.pages = {}
        self.copy = {}
        for relative_path in ("index.html", *EDITION_PAGES):
            path = ROOT / relative_path
            self.copy[path] = path.read_text(encoding="utf-8")
            self.pages[path] = Page()
            self.pages[path].feed(self.copy[path])
        self.page = self.pages[ROOT / "index.html"]
        self.html = self.copy[ROOT / "index.html"]

    def test_local_links_resolve(self):
        for path, page in self.pages.items():
            self.assertEqual(len(page.ids), len(set(page.ids)))
            for link in page.links:
                with self.subTest(page=path.name, link=link):
                    self.assertTrue(link)
                    destination = urlsplit(link)
                    if destination.netloc:
                        self.assertEqual(destination.scheme, "https")
                        self.assertIn(link, READING_SOURCES)
                        continue
                    self.assertFalse(destination.scheme)
                    if destination.path:
                        target = self._local_asset(path, destination.path)
                        if target.is_dir():
                            target /= "index.html"
                        self.assertIn(target, self.pages)
                    else:
                        target = path
                    if destination.fragment:
                        self.assertIn(unquote(destination.fragment), self.pages[target].ids)

    def _local_asset(self, page: Path, url_path: str) -> Path:
        relative_path = Path(unquote(url_path))
        self.assertFalse(relative_path.is_absolute())
        target = (page.parent / relative_path).resolve()
        self.assertTrue(target.is_relative_to(ROOT))
        return target

    def test_guide_and_academy_are_linked_with_sources(self):
        for fragment in ("#guide", "#academy"):
            self.assertIn(fragment, self.page.links)
        self.assertTrue(READING_SOURCES.issubset(self.page.links))

    def test_development_updates_and_help_are_linked(self):
        for fragment in ("#updates", "#support", "#engineering"):
            self.assertIn(fragment, self.page.links)
        self.assertGreaterEqual(len(self.page.update_dates), 1)
        self.assertTrue(all(self.page.update_dates))
        self.assertIn("Internal save and resume test", self.html)
        self.assertIn("Both editions are still in development.", self.html)

    def test_engineering_notes_cite_verifiable_scope(self):
        self.assertIn('id="engineering-title"', self.html)
        self.assertIn("Klord Fernandez Cayetano leads the product direction", self.html)
        self.assertIn("AI-assisted engineering", self.html)
        self.assertIn("Both game editions are still in development.", self.html)

    def test_assets_exist_and_have_text_alternatives(self):
        for path, page in self.pages.items():
            for asset in page.assets:
                with self.subTest(page=path.name, asset=asset):
                    self.assertTrue(self._local_asset(path, asset).is_file())
            for image in page.images:
                self.assertTrue(image.get("alt"))
                self.assertGreater(int(image["width"]), 0)
                self.assertGreater(int(image["height"]), 0)

    def test_semantics(self):
        for page in self.pages.values():
            self.assertEqual(1, page.headings.count(1))
            self.assertEqual(1, page.headings[0])
            self.assertTrue(all(right <= left + 1 for left, right in zip(page.headings, page.headings[1:])))
        self.assertGreater(self.page.details, 0)
        self.assertEqual(self.page.details, self.page.summaries)

    def test_release_copy_distinguishes_editions_from_concept_art(self):
        self.assertIn("Life on a Margin: The First Trade", self.html)
        self.assertEqual(2, self.html.count("Not yet released"))
        self.assertIn("Original concept art", self.html)
        self.assertNotIn("Download now", self.html)

    def test_gameplay_captures_are_labeled_on_all_three_pages(self):
        for path, page in self.pages.items():
            with self.subTest(page=path.name):
                self.assertIn("Development gameplay", self.copy[path])
                self.assertTrue(any("gameplay/" in image["src"] for image in page.images))

    def test_dedicated_edition_pages_report_prerelease_status(self):
        for page in EDITION_PAGES:
            with self.subTest(page=page):
                self.assertIn(page, self.page.links)
                self.assertIn("Not yet released", self.copy[ROOT / page])
                self.assertIn("Verified internally", self.copy[ROOT / page])


if __name__ == "__main__":
    unittest.main(verbosity=2)
