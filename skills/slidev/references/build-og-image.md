---
name: og-image
description: Configure Open Graph preview image for social sharing
---

# Open Graph Image

Set preview image for social media sharing.

## Custom URL

```md
---
seoMeta:
  ogImage: https://url.to.your.image.png
---
```

## Local Image

Place `./og-image.png` in project root - Slidev uses it automatically.

## Auto-generate

Generate from first slide:

```md
---
seoMeta:
  ogImage: auto
---
```

Uses Playwright to capture first slide. Requires playwright to be installed.

Generated image saved as `./og-image.png` - can be committed to repo.
