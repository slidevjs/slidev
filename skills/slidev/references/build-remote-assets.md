---
name: remote-assets
description: Bundle remote images and assets for offline use
---

# Bundle Remote Assets

Remote images are automatically cached on first run for faster loading.

## Remote Images

```md
![Remote Image](https://sli.dev/favicon.png)
```

Cached automatically by vite-plugin-remote-assets.

## Local Images

Place in `public/` folder and reference with leading slash:

```md
![Local Image](/pic.png)
```

Do NOT use relative paths like `./pic.png`.

## Custom Styling

Convert to img tag for custom sizes/styles:

```html
<img src="/pic.png" class="m-40 h-40 rounded shadow" />
```
