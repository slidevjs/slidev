---
depends:
  - custom/index#headmatter
relates:
  - features/og-image
tags: [SEO, head]
description: |
  Configure SEO meta tags for better social media sharing and search engine optimization.
---

# SEO Meta Tags

Slidev allows you to configure SEO meta tags in the headmatter to improve social media sharing and search engine optimization. You can set up Open Graph and Twitter Card meta tags to control how your slides appear when shared on social platforms.

## Configuration

Add the `seoMeta` configuration to your slides deck frontmatter:

```yaml
---
# SEO meta tags
seoMeta:
  ogTitle: Slidev Starter Template
  ogDescription: Presentation slides for developers
  ogImage: https://cover.sli.dev
  ogUrl: https://example.com
  twitterCard: summary_large_image
  twitterTitle: Slidev Starter Template
  twitterDescription: Presentation slides for developers
  twitterImage: https://cover.sli.dev
  twitterSite: username
  twitterUrl: https://example.com
---
```

This feature is powered by [unhead](https://unhead.unjs.io/)'s `useHead` hook, please refer to the [documentation](https://unhead.unjs.io/docs/head/api/composables/use-seo-meta) for more details.
