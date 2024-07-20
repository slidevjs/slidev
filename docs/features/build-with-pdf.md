---
depends:
  - guide/exporting
  - guide/hosting
relates:
  - CLI export options: /builtin/cli#export
  - Headmatter export options: /custom/#headmatter
tags: [export, build]
description: |
  Generate a downloadable PDF along with your slides build.
---

# Generate PDF when Building

You can provide a downloadable PDF in your built slides with the following config in headmatter:

```md
---
download: true
---
```

Slidev will generate a PDF file along with the build, and a download button will be displayed in the build.

You can also provide a custom URL for the PDF. In that case, the rendering process will be skipped.

```md
---
download: 'https://myside.com/my-talk.pdf'
---
```

This can also be done with the CLI option `--download` (`boolean` only).

```bash
$ slidev build --download
```

When using the download option, you can also provide the export options via:

- [CLI export options](/builtin/cli#export)
- [Headmatter export options](/custom/#frontmatter-configures)
