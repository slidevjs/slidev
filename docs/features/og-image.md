---
relates:
  - features/seo-meta
tags: ['SEO', head]
description: |
  Set the Open Graph image for your slides.
---

# Open Graph Image

Slidev allows you to set the Open Graph image via the `seoMeta.ogImage` option in the headmatter:

```md
---
seoMeta:
  ogImage: https://url.to.your.image.png
---

# Your slides here
```

Learn more about [SEO Meta Tags](./seo-meta).

## Local Image

If you have `./og-image.png` in your project root, Slidev will grab it as the Open Graph image automatically without any configuration.

## Auto-generate

Since v52.1.0, Slidev supports auto-generating the Open Graph image from the first slide.

You can set `seoMeta.ogImage` to `auto` to enable this feature.

```md
---
seoMeta:
  ogImage: auto
---
```

It will use [playwright](https://playwright.dev/) to capture the first slide and save it as `./og-image.png` (same as `slidev export`). You may also commit the generated image to your repository to avoid the auto-generation. Or if you generate it on CI, you might also want to setup the playwright environment.
