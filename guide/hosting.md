# Static Hosting

## Build Single Page Applications (SPA)

You can also build the slides into a self-hostable SPA:

```bash
$ slidev build
```

The generated application will be available under `dist/` and then you can host it on [GitHub Pages](https://pages.github.com/), [Netlify](https://netlify.app/), [Vercel](https://vercel.com/), or whatever you want. Now you can share your slides with the rest of the world with a single link.

### Base Path

To deploy your slides under sub-routes, you will need to pass the `--base` option. For example:

```bash
$ slidev build --base /talks/my-cool-talk/
```

Refer to [Vite's documentation](https://vitejs.dev/guide/build.html#public-base-path) for more details.

### Provide Downloadable PDF

You can provide a downloadable PDF to the viewers of your SPA with the following config:

```md
---
download: true
---
```

Slidev will generate a pdf file along with the build, and a download button will be displayed in the SPA.

You can also provide a custom url to the PDF. In that case, the rendering process will be skipped.

```md
---
download: 'https://myside.com/my-talk.pdf'
---
```

## Examples

Here are a few examples of the exported SPA:

- [Starter Template](https://sli.dev/demo/starter)
- [Composable Vue](https://talks.antfu.me/2021/composable-vue) by [Anthony Fu](https://github.com/antfu)

For more, check out [Showcases](/showcases).

## Hosting

We recommend to use `npm init slidev@lastest` to scaffolding your project, which contains the necessary configuration files for hosting services out-of-box.

### Netlify

- [Netlify](https://netlify.com/)

Create `netlify.toml` in your project root with the following content.

```ts
[build.environment]
  NODE_VERSION = "14"

[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Then go to your Netlify dashboard, create new site with the repository.

### Vercel

- [Vercel](https://vercel.com/)

Create `vercel.json` in your project root with the following content.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Then go to your Vercel dashboard, create new site with the repository.

## GitHub Pages

- [GitHub Pages](https://pages.github.com/)

Create `.github/workflows/deploy.yml` with following content to deploy your slides to GitHub Pages via GitHub Actions.

```yaml
name: Deploy pages
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy pages
        uses: crazy-max/ghaction-github-pages@v2
        with:
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
