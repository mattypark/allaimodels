# Launch checklist — allaimodels

Walked 2026-09-23 against the standing 20-item list. Measured, not assumed.
Six items are genuinely outstanding and are listed as such rather than fudged.

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Privacy policy page | **Outstanding** | No page yet. The site sets no cookies and collects nothing, but the page is still owed the moment analytics arrive (#19). |
| 2 | Terms & conditions | **Outstanding** | No page yet. Matters here more than usual: the site republishes benchmark figures and shows founder portraits. |
| 3 | Secrets off the frontend | **Done** | There are no secrets. Every source is public and keyless; `.env.example` exists only to say so. |
| 4 | Force HTTPS | **Pending deploy** | Vercel terminates TLS and redirects by default. Unverifiable until it is deployed. |
| 5 | Cookie consent banner | **n/a** | No cookies, no localStorage, no third-party scripts. Revisit with #19 — analytics would make this required. |
| 6 | Meta titles + descriptions | **Done** | `metadata` export on every route; a title template in `app/layout.tsx`. Lighthouse SEO 100. |
| 7 | Social preview image | **Outstanding** | OG and Twitter tags are set; there is no image behind them. Needs a generated OG card. |
| 8 | Favicon | **Done** | `app/icon.svg` — the release spine as four rising dots. |
| 9 | Sitemap + robots.txt | **Done** | `app/sitemap.ts` and `app/robots.ts`; both build as real routes. |
| 10 | Alt text on images | **Done** | Founder portraits take the person's name. The video poster is `alt=""` with a visible text label, which is correct for a decorative image inside a labelled control. |
| 11 | Compress images | **n/a** | The site ships no raster images. YouTube posters load from `i.ytimg.com` already compressed and lazily. |
| 12 | Page load speed | **Done** | LCP 84ms, CLS 0, measured on a production build. |
| 13 | Colour contrast | **Done** | Lighthouse accessibility 100 after adding `--accent-strong`; white on every lab accent had been failing AA. |
| 14 | Mobile friendly | **Partly done** | Verified at 375 and 1440, both themes, no horizontal overflow. **768 not yet checked.** |
| 15 | Custom 404 | **Done** | `app/not-found.tsx`, written for this site rather than generic. |
| 16 | Broken links | **Done** | Every static internal link resolves to a real route; all template links are `/labs/${slug}` and `generateStaticParams` covers every lab. |
| 17 | Form validation | **n/a** | No forms. The only inputs are comparison toggles. |
| 18 | Spam protection | **n/a** | No forms, no submissions, no user content. |
| 19 | Analytics | **Outstanding** | None installed. Deliberate for now — adding any pulls in #1 and #5. |
| 20 | One clear call to action | **Done** | "Browse the labs" in the hero; "Compare" persists in the nav. |

## What has to happen before this is called launched

1. Privacy policy and terms (#1, #2) — both short, both real obligations.
2. An OG image (#7) — currently every share is a bare link.
3. Check 768 (#14).
4. Decide on analytics (#19), knowing it drags #1 and #5 with it.
5. Deploy, then confirm HTTPS (#4).
