---
name: hosting
description: Build and deploy Slidev presentations
---

# Hosting & Deployment

Build and deploy Slidev presentations.

## Build for Production

```bash
slidev build
```

Output: `dist/` folder (static SPA)

### Options

```bash
slidev build --base /talks/my-talk/    # Custom base path
slidev build --out public              # Custom output dir
slidev build --download                # Include PDF
slidev build --without-notes           # Exclude notes
```

### Multiple Presentations

```bash
slidev build slides1.md slides2.md
```

## GitHub Pages

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'

      - name: Install
        run: npm install

      - name: Build
        run: npm run build -- --base /${{ github.event.repository.name }}/

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - uses: actions/deploy-pages@v4
```

## Netlify

Create `netlify.toml`:

```toml
[build]
  publish = 'dist'
  command = 'npm run build'

[[redirects]]
  from = '/*'
  to = '/index.html'
  status = 200
```

## Cloudflare Pages

Slidev auto-detects Cloudflare Pages when a `wrangler.toml` or `wrangler.json` is present in the project root.

Create `wrangler.toml`:

```toml
name = "my-slidev"
compatibility_date = "2026-04-29"
```

Build and deploy:

```bash
slidev build
npx wrangler pages deploy dist
```

Cloudflare Pages supports Netlify-style `_redirects` out of the box. When detected, Slidev also generates a `_headers` file with optimal cache settings for hashed assets.

### Local preview

Test with Wrangler locally:

```bash
npx wrangler pages dev dist
```

## Vercel

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Docker

### Using Official Image

```bash
docker run --name slidev --rm -it \
  -v ${PWD}:/slidev \
  -p 3030:3030 \
  tangramor/slidev:latest
```

### Custom Dockerfile

```dockerfile
FROM tangramor/slidev:latest

COPY slides.md .
COPY public ./public

RUN npm run build

EXPOSE 80
CMD ["npx", "serve", "dist"]
```

## Base Path

For subdirectory deployment:

```bash
# Build
slidev build --base /my-slides/

# Or in headmatter
---
base: /my-slides/
---
```

## Router Mode

For servers without rewrite support:

```yaml
---
routerMode: hash
---
```

URLs become: `/#/1`, `/#/2`, etc.
