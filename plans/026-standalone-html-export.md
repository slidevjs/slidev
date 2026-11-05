# Proposal 026: Standalone interactive HTML export

## Status

- **State**: implemented; verification results recorded below
- **Prepared**: 2026-11-04, against this Slidev v53.0.0 checkout
- **Amended**: 2026-11-04, after approval and a request for configurable file sizes
- **Amended**: 2026-11-05, after approval of opt-in online resource retention
- **Scope**: a portable, interactive HTML artifact opened directly in a browser
- **Estimated effort**: L; asset coverage and browser verification dominate
- **Risk**: medium-high; opt-in build behavior, but substantial asset edge cases
- **Dependencies**: none of the earlier plans are prerequisites; avoid the broad
  export refactor proposed in plan 023

The approved design is implemented in this working tree. The design rationale
below is retained as context; the implementation record distinguishes completed
checks from remaining baseline issues.

## Recommendation

Expose the feature as:

```bash
slidev export slides.md --format html
slidev export slides.md --format html --output presentation.html
slidev export slides.md --format html --without-notes
```

Implement HTML as a production-build exporter, not a Playwright renderer. Reuse
Slidev's parser, themes, addons, setup hooks, client and Vite configuration. The
result should retain slide navigation, click reveals, local interactions and
animations without Node.js, a web server, or adjacent files on the recipient's
machine. It is an executable web application, not a static HTML transcript.

Do not initially add a second public spelling such as `build --single-file`.
That is a reasonable alternative if maintainers prefer a build-oriented API,
but it should call the same implementation rather than create another pipeline.

## Evidence from Slidev

- [CLI dispatch](../packages/slidev/node/cli.ts) currently sends every export
  through export-mode option resolution, a Vite dev server and `exportSlides`.
  HTML must branch before importing the renderer, selecting a port, starting a
  server, or advertising the browser exporter.
- [Browser rendering](../packages/slidev/node/commands/export.ts) launches
  Chromium before dispatching formats. Adding an HTML branch inside that
  function would give a build-only feature the wrong dependencies and lifecycle.
- [Production builds](../packages/slidev/node/commands/build.ts) already own the
  virtual HTML entry and Vite invocation, followed by hosting-specific work:
  OG-image generation, `404.html`, `_redirects`, and optional PDF generation.
  Reuse the Vite portion, not those post-processing steps.
- [Configuration composition](../packages/slidev/node/commands/shared.ts)
  merges theme, addon and user configuration and installs Slidev's plugins.
  Standalone output must use this path rather than invoke an unrelated bundler.
- [Option resolution](../packages/slidev/node/options.ts) computes HTML and
  compile-time feature flags before returning. Resolve standalone overrides
  before creating these utilities; do not mutate a resolved config afterward.
  Keep the existing `build` mode so server-only functionality is compiled out.
- [Chunk configuration](../packages/slidev/node/vite/extendConfig.ts) assigns
  manual chunks. Standalone bundling must explicitly reconcile this with a
  single application bundle and inlined dynamic imports.
- [HTML setup](../packages/slidev/node/setups/indexHtml.ts) emits provider font
  stylesheets, favicon links, image preloads and some external embed scripts.
  Inlining application JavaScript and CSS alone is not sufficient for offline use.
- [Runtime image preloading](../packages/client/composables/usePreloadImages.ts)
  prefixes non-HTTP URLs with the base. This includes `data:` and `blob:` URLs
  today; standalone assets need correct URL handling or a scoped preload bypass.
- [Static copies](../packages/slidev/node/vite/staticCopy.ts) place theme/addon
  public assets under `theme/`, separately from the deck's public directory.
  The packaging resolver needs both namespaces.
- [Export types](../packages/types/src/cli.ts) and
  [headmatter defaults](../packages/types/src/config.ts) share export options.
  Effective format selection must respect CLI-over-headmatter precedence.

## Proposed implementation

### 1. CLI and export contract

Add `html` to CLI format choices. Determine the effective format per entry using
the existing CLI/headmatter precedence. Resolve HTML entries with production
build options before generating HTML and feature flags. If format discovery
requires initially resolving export options, re-resolve for the build rather
than reusing export-mode utilities with mutated state.

Keep the browser renderer's format type limited to browser-rendered formats.
An HTML-specific command module should own orchestration. Do not introduce a
general exporter registry or refactor the other exporters for this feature.

Follow the existing filename precedence: explicit output, `exportFilename`,
then the entry basename plus `-export`, with an HTML extension. Treat CLI output
paths as explicit user choices; do not let a deck-controlled filename become an
unrestricted new write path. Preflight multi-entry destinations for collisions;
reject one explicit file destination for multiple entries rather than overwrite.

Expose the existing notes-removal capability on HTML export. Recommended default:
retain notes, matching normal builds, but document that recipients can inspect
them. Test that `--without-notes` removes note content from the artifact, not
merely the presenter UI.

Reject explicitly requested print-only flags such as range selection, click-step
flattening and PDF outlines for HTML in v1. Document that HTML retains the whole
deck and its reveals. Do not accidentally reject inherited generic export
defaults or silently change their meaning. Define applicable settings, such as
dark appearance, deliberately; browser timing and screenshot scale do not apply.

### 2. Shared production build, isolated output target

Extract only the virtual-entry/configuration/Vite invocation from the existing
build command into a reusable helper. Leave normal SPA post-processing and its
behavior intact. The HTML command should call that helper directly.

Represent standalone output explicitly in resolved build options, rather than
using a process-wide environment variable or adding a new resolution mode.
Apply the target's policy before HTML setup and plugin creation:

- Hash routing and a relative base.
- No service worker/PWA generation or automatic PDF download artifact.
- No deployment redirects, duplicate HTML, OG screenshot generation, or server.
- No external source maps or unresolved application chunks.
- A scoped image-preloading policy that cannot corrupt embedded URLs. Prefer
  fixing URL classification with focused regression tests; disabling redundant
  preloading for this target is an acceptable bounded alternative.

Build in a private temporary directory. Validate the produced artifact before
publishing it, preserve an existing destination when building or validation
fails, and always remove temporary files. Use safe replacement semantics on the
destination filesystem rather than assuming a cross-filesystem rename works.

### 3. Asset packaging

Start with `vite-plugin-singlefile` for application JavaScript/CSS, imported
assets, and dynamic-import bundling. Load it only for standalone export. Follow
the pnpm production catalog convention for runtime dependencies. Confirm its
resolved options and hook ordering with a real Vite fixture.

Add the smallest Slidev-specific asset resolver necessary around that plugin:

- Cover imported assets, deck public files, theme/addon public files, HTML media
  and favicon attributes, CSS backgrounds and fonts, and generated slide assets.
- Test `srcset`, media sources/posters, SVG fragments, query strings, percent
  encoding, nested paths and repeated references explicitly.
- Resolve against known asset namespaces, preserve URL fragments where required,
  and confine reads to permitted roots, including symlink/realpath checks.
- Use bundler ASTs and structured HTML/CSS parsers; reuse existing suitable
  dependencies and utilities before introducing new ones. Do not rewrite every
  matching string or use regexes as the primary parser.
- Give actionable diagnostics for missing local files, remaining chunks, and
  detectable unsupported resource dependencies. A file count of one is not proof
  that the presentation is self-contained.

Remote resources need an explicit policy. Recommended: support build-time
embedding of Slidev's configured font-provider stylesheets and their font files,
plus the default favicon, with bounded downloads and actionable failures. Reuse
the existing remote-assets integration where it actually covers other declared
static assets; prove that coverage with fixtures. Do not silently drop fonts,
turn off custom styling, or recursively crawl arbitrary remote sites.

Normal hyperlinks remain hyperlinks and are not dependencies to download.
Known live embeds and APIs cannot be made offline by bundling their URLs. The
default export rejects detectable required external resources with explanations.
The opt-in `export.html.allowRemote` policy retains HTTP(S) resources and permits
known online embeds, with a connectivity warning. Local assets remain embedded.
CLI flags `--allow-remote` and `--no-allow-remote` override the headmatter value.
This does not permit missing local files, local embedded documents, `srcdoc`,
custom CSP/base tags, or unresolved application/worker chunks. Retained remote
resources are outside the HTML byte budget and image processing.
Arbitrary component-generated requests cannot be exhaustively detected at build
time; document the supported contract and prove it for representative fixtures.

### 4. Lossless deduplication

Implement lossless deduplication as an independently testable packaging stage:
one payload per identical MIME type/byte sequence,
document-local Blob URLs, and bootstrap completion before application modules.
Keep URLs alive for the document lifetime and rebuild the registry on reload.
Use neutral names and account for CSS/font/media consumers and HTML escaping.
Mask large payloads before AST parsing to bound memory use.

Implement this after the baseline offline artifact works, preferably as a
separate reviewable commit or follow-up PR. Whether it must ship in the initial
feature is a discussion point. Keep deduplication lossless and independent of
the optional image processing and size-budget controls below.

### 5. Configurable size budgets and image controls

Add HTML-specific configuration under the existing `export` headmatter section:

```yaml
---
export:
  html:
    maxBytes: 8000000
    images:
      maxWidth: 1920
      maxHeight: 1080
      quality: 85
---
```

These settings are implemented. In this example, 8 MB means 8,000,000 bytes,
not 8 MiB. No budget or image transformation
is enabled unless configured. The example is not a new default delivery profile.

Provide matching HTML-only CLI overrides:

```bash
slidev export --format html --max-bytes 8000000
slidev export --format html --max-bytes 8000000 --image-max-width 1920 --image-max-height 1080 --image-quality 85
```

Resolve each field using CLI over `export.html` over unchanged-source defaults.
Keep the nested HTML settings separate from browser-renderer options. Reject
explicit use of these CLI flags with other export formats; inherited HTML
settings do not affect PDF export, normal builds, or development.

Define the hard budget precisely:

- `maxBytes` is a positive safe integer. Success requires final UTF-8 HTML file
  size to be less than or equal to that value; equality is allowed.
- Measure the complete artifact after embedding, deduplication and bootstrap
  injection. Source-asset size, gzipped size and decoded browser memory are not
  the delivery size; base64 and HTML overhead count toward the budget.
- A cap does not imply automatic quality reduction. If the artifact is too
  large, exit with an actionable diagnostic and preserve the existing output.
  Report actual bytes, the budget, and the largest unique embedded assets with
  MIME types and encoded contributions. Distinguish application/bootstrap
  overhead from media contributions when suggesting reductions.
- Never pad files to an exact byte count, remove slides or media, externalize
  resources, or weaken the offline contract to meet the cap. A video or the
  application bundle alone may make the requested limit impossible.

Apply image controls through a dedicated preprocessing stage before embedding,
with a proven image library loaded only when processing is requested:

- Resize within `maxWidth`/`maxHeight` while preserving aspect ratio, orientation
  and transparency; never upscale. Validate positive integer bounds and codec
  constraints. Only apply the dimensions that were specified.
- `quality` is an integer from 1 to 100 for supported lossy raster formats such
  as JPEG and WebP. Preserve the format and define codec-specific behavior in
  documentation; PNG resizing remains lossless and does not use this quality
  value. Do not silently rasterize SVG or flatten animated images.
- Leave image bytes unchanged by default. When only dimensions are configured,
  avoid implicit lossy-quality defaults; use lossless re-encoding where supported
  or require explicit quality for a codec that cannot preserve pixels losslessly.
  Explicit resizing necessarily changes pixels; preserving pixels here refers
  to avoiding additional codec loss beyond the requested resize.
- Process supported imported, deck-public and theme/addon images consistently;
  do not restrict optimization to one public directory. Keep source files
  untouched, cache processed bytes by source and settings, then deduplicate the
  resulting payloads. Fonts, application code and audio/video remain unchanged.
- Retain the same cleanup, failure preservation and offline browser gates as
  the lossless exporter. Test CSS crops, EXIF orientation, alpha and repeated
  references in particular.

The first increment should provide a strict cap plus explicit image controls.
An optional future `targetBytes` setting could attempt automatic fitting within
user-approved minimum quality/resolution bounds and a bounded number of attempts.
It would be a best-effort goal, not an exact-size guarantee; the hard `maxBytes`
limit must still decide whether the artifact can be published. Do not add an
automatic search loop or silently degrade quality as part of the initial cap.

## Verification and contribution plan

1. Add colocated Vitest tests for filename/default precedence, target options,
   asset resolution, containment, parsers, ordering, notes removal, deduplication,
  size validation and failure cleanup. Include byte-exact budget boundaries,
  encoded overhead, CLI/headmatter precedence, image bounds/quality validation,
  source preservation, and an impossible budget. Keep these tests free of a
  browser requirement.
2. Add a small build fixture using synthetic assets and a lightweight local
   theme/addon. Assert normal builds are unchanged, HTML works without installing
   Playwright, unsupported flags have clear errors, and failed exports preserve
  the previous file. Verify that exceeding a size cap preserves the destination
  and that opt-in image processing changes neither sources nor normal builds.
  Use a deterministic local HTTP fixture for remote assets.
3. Add a browser smoke to an explicit browser-enabled gate, not implicitly to
   default unit tests. The production smoke workflow already installs Chromium;
   extend that machinery where practical, subject to maintainer agreement.
4. Copy only the generated HTML into an unrelated directory, disconnect network
   access, and open it through `file://`. Traverse every slide and reveal; assert
   images/fonts/CSS crops/diagrams render, a local interaction works, finite
   motion runs, and embedded media actually plays. Reload a non-first slide and
   check for outside requests, runtime errors and resource failures. Use desktop
   and smaller viewports; exercise supported platforms in CI.
5. Add negative fixtures for missing/remote dependencies, dynamic resource paths,
   restrictive configuration, and large repeated media. Browser restrictions on
   workers, file origins and multi-window synchronization must be documented,
   not hidden by broadly ignoring console errors.
6. Update the exporting guide and CLI reference in this repository. Clarify that
   HTML requires no Playwright, explain notes and redistribution rights, state
   offline limitations, and distinguish this from a hosted SPA or PWA. Update
   the maintained exporting skill reference if its guidance changes.
7. Run `pnpm verify` before opening a PR, as required by the contribution guide.
   Build before tests because workspace imports resolve to built artifacts.
   Include the isolated-file browser smoke in the feature's completion evidence.

Suggested delivery order: prove one synthetic deck on the current toolchain,
add asset/remote-resource coverage, add deduplication, add size budgets and
opt-in image controls, then finish CI and documentation. No publication or PR
creation is implied.

## Decisions for discussion

| Decision | Recommended starting point |
| --- | --- |
| Public command | `export --format html`; build-based internally |
| Offline contract | Actual isolated `file://` playback, not merely one emitted HTML file |
| Notes | Include by default for build parity; expose `--without-notes` |
| Remote defaults | Embed supported static resources at build time; opt-in `allowRemote` retains HTTP(S) resources and permits online embeds with a connectivity warning |
| Deduplication | Preserve the design, implement as a separate reviewable stage; decide initial-PR scope |
| Image quality/size | Preserve bytes by default; opt-in `export.html.maxBytes` and image controls, no hardcoded delivery cap |
| Automatic fitting | Separate future opt-in target; no exact-size guarantee or silent quality reduction |
| Browser exporter UI | Out of scope initially; packaging requires the Node/Vite build pipeline |
| Workers/live APIs/presenter sync | Explicit limitations until individually supported and tested |

## Verification performed during analysis

The analysis covered Slidev's contribution guidance, export/build configuration,
asset handling, dependency declarations and CI. The implementation record below
lists the completed tests and remaining limitations.

## Implementation record

Implemented on 2026-11-04:

- [HTML command](../packages/slidev/node/commands/html.ts): settings validation,
  filename policy, temporary build orchestration, final UTF-8 byte budget,
  asset-size diagnostics and destination-filesystem staging/replacement.
- [Single-file plugin](../packages/slidev/node/vite/singlefile.ts): Vite 8
  bundling, structured asset rewriting, local/remote resource embedding, optional
  raster processing and a lossless, document-local asset registry.
- CLI/headmatter dispatch, production option resolution, shared build invocation,
  notes removal and rejection of incompatible flags are wired into the existing
  commands without routing HTML through Playwright.
- The exporting guide, CLI reference, exporting skill and browser-enabled CI job
  have been updated. Ordinary unit tests do not require a browser.

Verification results:

- Workspace build and typecheck pass.
- `pnpm test`: 37 files, 393 tests pass, including 15 focused feature tests.
- `pnpm test:html`: isolated `file://` playback passes at 1440x900 and 390x844.
  Checks include exact registry-owned resource requests, fonts, responsive and
  resized images, CSS crops, Mermaid, finite animation, reveals, audio playback,
  component interaction, non-first-slide reload, notes removal, unchanged source
  assets and preservation of existing output on an impossible size budget.
- The synthetic deck produces approximately 6.09 MB of standalone HTML with
  Mermaid included. This is a fixture result, not a general size guarantee.
- Focused lint passes for touched feature files. Full `pnpm verify` reaches lint
  but is blocked by eight existing YAML flow-sequence spacing errors in the
  untouched CR and production-smoke workflows. Those files were not changed.

Limits remain explicit: arbitrary component-generated requests, dynamically
constructed paths, resources nested inside custom asset formats, multi-window
presenter synchronization, and browser-managed `file://` restrictions are not a
universal offline guarantee. Video bytes use the same media packaging path, but
the automated playback fixture exercises audio, not every video codec.
