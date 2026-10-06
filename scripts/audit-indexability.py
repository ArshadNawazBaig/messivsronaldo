#!/usr/bin/env python3
"""Read-only audit of public HTML as received without JavaScript.

python3 scripts/audit-indexability.py --output .artifacts/indexability.json
Use --all to check every sitemap URL, or --origin http://localhost:3000
--canonical-origin https://messivsronaldo17.com to check a production build.
This checks technical eligibility, not Google's actual index status.
"""
import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
import gzip
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import time
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch(url):
    request = Request(url, headers={"User-Agent": "RivalryIndexabilityAudit/1.0", "Accept-Language": "en", "Accept-Encoding": "gzip"})
    started = time.monotonic()
    try:
        response = build_opener(NoRedirect).open(request, timeout=45)
    except HTTPError as error:
        response = error
    with response:
        body = response.read()
        if response.headers.get("Content-Encoding", "").lower() == "gzip":
            body = gzip.decompress(body)
        return response.status, dict(response.headers.items()), body.decode("utf-8", errors="replace"), round(time.monotonic() - started, 3)


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title, self.h1, self.main, self.links = [], [], [], []
        self.canonical, self.alternates, self.robots = [], {}, []
        self.language = ""
        self.in_head = self.in_title = self.in_h1 = self.in_main = self.ignored = False
        self.h1_count = 0
        self.descriptions, self.schemas, self.schema_errors, self.images = [], [], [], []
        self.main_links, self.headings = [], []
        self.schema_buffer = None
        self.heading = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "html":
            self.language = attrs.get("lang", "")
        if tag == "head":
            self.in_head = True
        # SVG charts also contain title elements; those are not SEO titles.
        if tag == "title" and self.in_head:
            self.in_title = True
        if tag == "main":
            self.in_main = True
        if tag == "h1":
            self.in_h1 = True
            self.h1_count += 1
        if tag in ("script", "style"):
            self.ignored = True
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.schema_buffer = []
        if tag in ("h1", "h2", "h3"):
            self.heading = {"level": tag, "text": []}
        if tag == "img" and self.in_main:
            self.images.append({key: attrs.get(key) for key in ("src", "alt", "width", "height", "loading", "sizes")})
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
            if self.in_main:
                self.main_links.append(attrs["href"])
        if tag == "link":
            if attrs.get("rel") == "canonical":
                self.canonical.append(attrs.get("href"))
            if attrs.get("rel") == "alternate" and attrs.get("hreflang"):
                self.alternates[attrs["hreflang"]] = attrs.get("href")
        if tag == "meta" and attrs.get("name", "").lower() in ("robots", "googlebot"):
            self.robots.append(attrs.get("content", ""))
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.descriptions.append(attrs.get("content", ""))

    def handle_endtag(self, tag):
        if tag == "script" and self.schema_buffer is not None:
            try:
                self.schemas.append(json.loads("".join(self.schema_buffer)))
            except ValueError as error:
                self.schema_errors.append(str(error))
            self.schema_buffer = None
        if self.heading and tag == self.heading["level"]:
            self.headings.append({"level": tag, "text": "".join(self.heading["text"]).strip()})
            self.heading = None
        if tag == "title":
            self.in_title = False
        if tag == "head":
            self.in_head = False
            self.in_title = False
        if tag == "h1":
            self.in_h1 = False
        if tag == "main":
            self.in_main = False
        if tag in ("script", "style"):
            self.ignored = False

    def handle_data(self, data):
        if self.schema_buffer is not None:
            self.schema_buffer.append(data)
        if self.ignored:
            return
        if self.heading:
            self.heading["text"].append(data)
        if self.in_title:
            self.title.append(data)
        if self.in_h1:
            self.h1.append(data)
        if self.in_main:
            self.main.append(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", default="https://messivsronaldo17.com")
    parser.add_argument("--canonical-origin", default="https://messivsronaldo17.com")
    parser.add_argument("--input", default="docs/indexing-urls-2026-09-27.json")
    parser.add_argument("--output", default=".artifacts/indexability.json")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--workers", type=int, choices=range(1, 9), default=4)
    args = parser.parse_args()
    origin, canonical_origin = args.origin.rstrip("/"), args.canonical_origin.rstrip("/")
    robots_status, _, robots_text, _ = fetch(origin + "/robots.txt")
    if robots_status != 200:
        raise RuntimeError(f"robots.txt returned {robots_status}")
    robots_rules = RobotFileParser()
    robots_rules.parse(robots_text.splitlines())
    status, _, xml, _ = fetch(origin + "/sitemap.xml")
    if status != 200:
        raise RuntimeError(f"Sitemap returned {status}")
    sitemap_root = ET.fromstring(xml)
    sitemap_urls = [item.text.rstrip("/") for item in sitemap_root.findall("{*}url/{*}loc")]
    # Derive supported language prefixes from the sitemap, including Thai and
    # future additions, instead of letting the auditor misclassify them as English.
    sitemap_languages = {item.get("hreflang") for item in sitemap_root.findall("{*}url/{*}link")} - {None, "x-default"}
    sitemap = set(sitemap_urls)
    if len(sitemap_urls) != len(sitemap):
        raise RuntimeError("Sitemap contains duplicate URLs")
    groups = json.loads(Path(args.input).read_text()) if not args.all else {"sitemap": sorted(sitemap)}
    targets = [(group, urlsplit(url).path or "/") for group, urls in groups.items() for url in urls]

    def audit(target):
        group, path = target
        expected = canonical_origin + (path if path != "/" else "")
        try:
            status, headers, html, elapsed = fetch(origin + path)
            page = Page()
            page.feed(html)
            headers = {key.lower(): value for key, value in headers.items()}
            robots = ", ".join(page.robots + [headers.get("x-robots-tag", "")]).lower()
            content = " ".join(" ".join(page.main).split())
            errors = []
            if not robots_rules.can_fetch("Googlebot", origin + path):
                errors.append("blocked by robots.txt")
            if status != 200:
                errors.append(f"HTTP {status}")
            if "noindex" in robots or "none" in robots.split(","):
                errors.append("noindex")
            if len(page.canonical) != 1 or page.canonical[0].rstrip("/") != expected:
                errors.append("non-self canonical")
            if expected not in sitemap:
                errors.append("absent from sitemap")
            if page.h1_count != 1:
                errors.append(f"{page.h1_count} h1 headings")
            if not page.title:
                errors.append("missing title")
            if not content:
                errors.append("no server-rendered main content")
            first = path.split("/")[1]
            language = first if first in sitemap_languages else "en"
            if page.language != language:
                errors.append("incorrect html language")
            if page.alternates.get(language, "").rstrip("/") != expected:
                errors.append("missing self hreflang")
            for href in page.alternates.values():
                if href.rstrip("/") not in sitemap:
                    errors.append("hreflang target absent from sitemap")
                    break
            return {"group": group, "path": path, "status": status, "seconds": elapsed,
                    "bytes": len(html.encode()), "title": "".join(page.title), "h1": "".join(page.h1),
                    "canonical": page.canonical, "robots": robots, "language": page.language,
                    "descriptions": page.descriptions, "headings": page.headings,
                    "alternates": page.alternates, "schemas": page.schemas, "schemaErrors": page.schema_errors,
                    "images": page.images,
                    "cacheControl": headers.get("cache-control"), "contentEncoding": headers.get("content-encoding"),
                    "words": len(content.split()), "contentHash": sha256(content.encode()).hexdigest(),
                    "mainText": content, "mainLinks": sorted(set(urljoin(canonical_origin + path, href).split("#")[0] for href in page.main_links)),
                    "links": sorted(set(urljoin(canonical_origin + path, href).split("#")[0] for href in page.links)), "errors": errors}
        except Exception as error:
            return {"group": group, "path": path, "errors": [str(error)]}

    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for result in pool.map(audit, targets):
            results.append(result)
            if len(results) % 25 == 0:
                print(f"Checked {len(results)}/{len(targets)}", flush=True)
    failures = [{"path": row["path"], "errors": row["errors"]} for row in results if row["errors"]]
    report = {"checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "origin": origin,
              "sitemapCount": len(sitemap), "checked": len(results), "failures": failures, "pages": results}
    # These are review signals, not automatic noindex/redirect decisions.
    duplicate_groups = {}
    for field in ("title", "descriptions", "contentHash"):
        groups = defaultdict(list)
        for row in results:
            value = row.get(field)
            if value:
                groups[(row.get("language"), json.dumps(value, ensure_ascii=False))].append(row["path"])
        duplicate_groups[field] = [paths for paths in groups.values() if len(paths) > 1]
    report["duplicatesByLanguage"] = duplicate_groups
    report["missingDescriptions"] = [row["path"] for row in results if row.get("status") == 200 and not any(row.get("descriptions", []))]
    report["invalidJsonLd"] = [{"path": row["path"], "errors": row["schemaErrors"]} for row in results if row.get("schemaErrors")]
    if args.all:
        pages = {row["path"]: row for row in results}
        reachable, pending = set(), ["/"]
        while pending:
            path = pending.pop()
            if path in reachable or path not in pages:
                continue
            reachable.add(path)
            for href in pages[path].get("links", []):
                url = urlsplit(href)
                if url.netloc == urlsplit(canonical_origin).netloc and not url.query:
                    pending.append(url.path or "/")
        report["htmlLinkReachable"] = len(reachable)
        report["htmlLinkUnreachable"] = sorted(set(pages) - reachable)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "pages"}, indent=2))
    raise SystemExit(bool(failures))


if __name__ == "__main__":
    main()
