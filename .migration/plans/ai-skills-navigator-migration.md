# AI Skills Navigator — Page Migration Plan

## Goal
Migrate the page at `https://aiskillsnavigator.microsoft.com/` into this AEM Edge Delivery Services project as authored content, rendering correctly in local preview and ready for upload to Document Authoring.

## Context (from repo inspection)
- **Project type:** Document Authoring (DA) — content host is `content.da.live/scherneff/ms-skilling/`, org `scherneff`, site `ms-skilling`.
- **Block library endpoint:** `https://main--ms-skilling--scherneff.aem.page/docs/library/blocks.json`.
- **Existing blocks available for reuse:** `hero`, `cards`, `columns`, `teaser`, `tabs`, `faq`, `table`, `embed`, `search`, `header`, `footer`, `related-articles`, `journey-map`, `quiz`, `form`, plus several calculators.
- **Content lives in** the project's content directory; import must be produced via the bundled import script (no hand-authored HTML), then previewed and optionally uploaded to DA.
- No importer infrastructure (`tools/importer`, `page-templates.json`) exists yet — this will be created as part of the migration.

## Assumptions (please correct if wrong)
- Scope = the single homepage of `aiskillsnavigator.microsoft.com` (not the full site).
- Target destination path in DA = `/ai-skills-navigator` (or root `/index`) — to be confirmed.
- Reuse existing blocks where they fit; only create new block variants where the source design has no match.

## Checklist

### Phase 1 — Setup & analysis
- [ ] Confirm scope, target content path, and whether new blocks may be created (via question if unclear)
- [ ] Scrape `https://aiskillsnavigator.microsoft.com/` — capture cleaned HTML, metadata, screenshots, and download images
- [ ] Survey the project block inventory + Block Library endpoint to know the available palette
- [ ] Identify page structure: section boundaries and content sequences (two-level analysis)

### Phase 2 — Content modeling
- [ ] Map each content sequence to default content vs. an existing block vs. a new block variant
- [ ] Validate block selection and section styling (authoring analysis)
- [ ] Design/create any new block variants required, styling them to match the source (visual design extraction)

### Phase 3 — Import infrastructure
- [ ] Create page template(s) with block mappings (`page-templates.json`)
- [ ] Generate block parsers and page transformers (`tools/importer/`)
- [ ] Assemble and bundle the project import script

### Phase 4 — Execute import
- [ ] Run the bulk import to produce structured content HTML in the project content directory
- [ ] Preview the imported page locally and verify rendering (structure, images, blocks)

### Phase 5 — Validation & QA
- [ ] Visually compare the migrated page against the original; fix styling/content gaps
- [ ] Check accessibility (heading hierarchy, image alt text) and responsiveness (600/900/1200px)
- [ ] Run `npm run lint` and resolve any issues

### Phase 6 — Delivery (optional, on request)
- [ ] Upload the migrated page to Document Authoring (`admin.da.live`)
- [ ] Report preview/live URLs

---
*This plan is read-only (plan mode). Execution — scraping, generating import infrastructure, running the import, and previewing — requires switching to Execute mode.*

Two open questions before execution — I can proceed with the assumptions above if you'd prefer.# AI Skills Navigator — Page Migration Plan

## Goal
Migrate `https://aiskillsnavigator.microsoft.com/` — **the homepage plus the main pages it links to** — into this AEM Edge Delivery Services project as authored content, rendering correctly in local preview and ready for upload to Document Authoring.

## Context (from repo inspection)
- **Project type:** Document Authoring (DA) — content host `content.da.live/scherneff/ms-skilling/`, org `scherneff`, site `ms-skilling`.
- **Block library endpoint:** `https://main--ms-skilling--scherneff.aem.page/docs/library/blocks.json`.
- **Existing blocks for reuse:** `hero`, `cards`, `columns`, `teaser`, `tabs`, `faq`, `table`, `embed`, `search`, `header`, `footer`, `related-articles`, `journey-map`, `quiz`, `form`, plus calculators.
- Content is produced only via the bundled import script (no hand-authored HTML), then previewed and optionally uploaded to DA.
- No importer infrastructure (`tools/importer`, `page-templates.json`) exists yet — created as part of this migration.

## Decisions (confirmed)
- **Scope:** Homepage + the main pages it links to (in-domain navigation/hero/section links). The homepage is migrated first; linked in-scope pages follow.
- **Target:** Homepage → **root `/index`**; linked pages keep their source path structure under root.
- **New blocks:** Allowed — create new block variants where no existing block matches the source design.

## Checklist

### Phase 1 — Setup & analysis
- [ ] Scrape the homepage — cleaned HTML, metadata, screenshots, download images
- [ ] Enumerate in-domain links from the homepage; select the set of linked pages in scope
- [ ] Scrape each in-scope linked page (cleaned HTML, metadata, images)
- [ ] Survey project block inventory + Block Library endpoint for the available palette
- [ ] Identify page structure per page: section boundaries and content sequences (two-level analysis)

### Phase 2 — Content modeling
- [ ] Map each content sequence to default content vs. existing block vs. new block variant
- [ ] Group pages into templates (homepage template + shared templates for similar linked pages)
- [ ] Validate block selection and section styling (authoring analysis)
- [ ] Design/create any new block variants required; style to match the source (visual design extraction + verify)

### Phase 3 — Import infrastructure
- [ ] Create page template(s) with block mappings (`page-templates.json`)
- [ ] Generate block parsers and page transformers (`tools/importer/`)
- [ ] Assemble and bundle the project import script

### Phase 4 — Execute import
- [ ] Run the bulk import for the homepage (→ `/index`) and in-scope linked pages
- [ ] Preview each imported page locally; verify structure, images, and blocks render

### Phase 5 — Validation & QA
- [ ] Visually compare each migrated page against its original; fix styling/content gaps
- [ ] Check accessibility (heading hierarchy, image alt text) and responsiveness (600/900/1200px)
- [ ] Run `npm run lint` and resolve issues

### Phase 6 — Delivery (optional, on request)
- [ ] Upload migrated pages to Document Authoring (`admin.da.live`)
- [ ] Report preview/live URLs

## Notes
- Homepage replaces the current root `/index` — the existing index content will be overwritten. Flagging since this is destructive; will confirm before the import step writes to `/index`.
- Linked-page set will be finalized after scraping the homepage (depends on actual in-domain links found).

---
*This plan is read-only (plan mode). Execution — scraping, building import infrastructure, running the import, and previewing — requires switching to Execute mode.*
