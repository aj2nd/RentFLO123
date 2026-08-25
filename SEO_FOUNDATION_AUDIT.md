# RentFLO SEO Foundation Audit

## Scope and Baseline

RentFLO’s public homepage was discoverable in a general web search for its brand name, but similarly named **RentFlow** products also appeared prominently. The live page had a title, description, and basic index directive, but it lacked a canonical URL, served its missing `robots.txt` and `sitemap.xml` paths as the single-page application HTML shell, used relative Open Graph URLs, referenced a missing social-preview image, and declared a non-functional on-site search action.

| SEO signal | Baseline | Applied correction |
|---|---|---|
| Canonical identity | No canonical link; relative structured-data URL | Absolute `https://rentflo.in/` canonical and absolute public metadata URLs |
| Crawling discovery | No dedicated robots file or XML sitemap | Root `robots.txt` with sitemap declaration and an XML sitemap containing the public canonical homepage |
| Brand understanding | Basic `WebSite` JSON-LD with an invalid search action | Accurate `Organization`, `WebSite`, and `WebPage` JSON-LD graph anchored to the canonical domain |
| Public/private separation | Private SPA routes shared the generic public HTML head | Server `X-Robots-Tag: noindex, nofollow, noarchive` on dashboard, onboarding, and authenticated app routes |
| Social metadata | Relative URL fields and a missing `og-image.png` | Absolute URLs and an existing official RentFLO wordmark asset with alt text |

The sitemap uses a fully qualified canonical URL, as Google documents for sitemap URLs. Google also describes canonical links, sitemaps, and structured data as **signals and hints**, not ranking guarantees. [1] [2] [3]

## What This Does and Does Not Do

These updates remove preventable technical barriers and make the official brand page easier for crawlers to identify. They cannot guarantee first position: Google determines rankings using many signals, including query intent, competitors, relevance, reputation, and indexed content quality. The practical next step is to submit `https://rentflo.in/sitemap.xml` through the verified RentFLO property in Google Search Console, request indexing of `https://rentflo.in/`, and monitor the brand query report over time.

## Validation

Run the following after any metadata or crawler-routing update:

```bash
pnpm exec tsx scripts/verify-seo-foundation.ts
pnpm run build
```

## Search Console Sitemap Fetch Follow-up

Google Search Console initially showed **“Couldn’t fetch”** immediately after the sitemap was submitted. A crawler-relevant request made after deployment returned HTTP 200, `application/xml`, valid XML, and the expected canonical homepage; `robots.txt` also returned HTTP 200 and declared the sitemap. The observed public origin response was comparatively slow, so the robots and sitemap files now use a short shared cache (`max-age=3600`) plus `stale-while-revalidate`, reducing the chance that a crawler receives a cold-origin delay for these tiny, infrequently changing discovery files.

The first failure therefore appears transient rather than an invalid sitemap. Keep the submitted URL in Search Console. After the cache policy deploys, open the submitted sitemap row, tap **Resubmit sitemap**, and allow Google time to retry; Search Console can take several hours to update its displayed status.

## References

[1]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap "Google Search Central: Build and submit a sitemap"
[2]: https://developers.google.com/search/docs/crawling-indexing/canonicalization "Google Search Central: What is canonicalization"
[3]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data "Google Search Central: Introduction to structured data markup"
