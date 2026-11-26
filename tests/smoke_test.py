"""Check the self-contained prerelease landing page with Python's standard library."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import unittest

ROOT = Path(__file__).resolve().parents[1]


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

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a":
            self.links.append(attrs.get("href"))
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.assets.append(attrs["href"])
        if tag == "img":
            self.assets.append(attrs["src"])
            self.images.append(attrs)
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.headings.append(int(tag[1]))
        if tag == "details":
            self.details += 1
        if tag == "summary":
            self.summaries += 1


class SiteSmokeTest(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.page = Page()
        self.page.feed(self.html)

    def test_local_links_resolve(self):
        self.assertEqual(len(self.page.ids), len(set(self.page.ids)))
        for link in self.page.links:
            with self.subTest(link=link):
                self.assertTrue(link)
                destination = urlsplit(link)
                self.assertFalse(destination.scheme or destination.netloc)
                self.assertFalse(destination.path)
                self.assertIn(unquote(destination.fragment), self.page.ids)

    def test_assets_exist_and_have_text_alternatives(self):
        for asset in self.page.assets:
            with self.subTest(asset=asset):
                self.assertTrue((ROOT / asset).is_file())
        for image in self.page.images:
            self.assertTrue(image.get("alt"))
            self.assertGreater(int(image["width"]), 0)
            self.assertGreater(int(image["height"]), 0)

    def test_semantics(self):
        self.assertEqual(1, self.page.headings.count(1))
        self.assertEqual(1, self.page.headings[0])
        self.assertTrue(all(right <= left + 1 for left, right in zip(self.page.headings, self.page.headings[1:])))
        self.assertGreater(self.page.details, 0)
        self.assertEqual(self.page.details, self.page.summaries)

    def test_release_copy_distinguishes_editions_from_concept_art(self):
        self.assertIn("Life on a Margin: The First Trade", self.html)
        self.assertEqual(2, self.html.count("Not yet released"))
        self.assertIn("Original concept art", self.html)
        self.assertNotIn("Download now", self.html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
