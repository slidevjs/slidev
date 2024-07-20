---
relates:
  - vite-plugin-remote-assets: https://github.com/antfu/vite-plugin-remote-assets
tags: [build]
description: |
  Download and bundle remote assets when building your slides.
---

# Bundle Remote Assets

Just like you would do in markdown, you can use images pointing to a remote or local URL.

For remote assets, the built-in [`vite-plugin-remote-assets`](https://github.com/antfu/vite-plugin-remote-assets) will cache them onto the disk at first run, ensuring instant loading even for large images later on.

```md
![Remote Image](https://sli.dev/favicon.png)
```

For local assets, put them into the [`public` folder](/custom/directory-structure.html#public) and reference them with a **leading slash** (i.e., `/pic.png`, NOT `./pic.png`, which is relative to the working file).

```md
![Local Image](/pic.png)
```

If you want to apply custom sizes or styles, you can convert them to the `<img>` tag:

```html
<img src="/pic.png" class="m-40 h-40 rounded shadow" />
```
