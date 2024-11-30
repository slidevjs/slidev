---
outline: deep
---

# Building and Hosting

Slidev is designed to run as a web server when you are editing or presenting your slides. However, after the presentation, you may still want to share your **interactive** slides with others. This guide will show you how to build and host your slides.

## Build as a SPA {#spa}

You can build the slides into a static [Single-page application (SPA)](https://developer.mozilla.org/en-US/docs/Glossary/SPA) via the following command:

```bash
$ slidev build
```

By default, the generated files are placed in the `dist` folder. You can test the built version of you slides by running: `npx vite preview` or any other static server.

### Base Path {#base}

To deploy your slides under sub-routes, you need to pass the `--base` option. The `--base` path **must begin and end with a slash `/`**. For example:

```bash
$ slidev build --base /talks/my-cool-talk/
```

Refer to [Vite's documentation](https://vitejs.dev/guide/build.html#public-base-path) for more details.

### Output directory {#output-directory}

You can change the output directory using `--out`.

```bash
$ slidev build --out my-build-folder
```

### Multiple Builds {#multiple-builds}

You can build multiple slide decks in one go by passing multiple markdown files as arguments:

```bash
$ slidev build slides1.md slides2.md
```

Or if your shell supports it, you can use a glob pattern:

```bash
$ slidev build *.md
```

In this case, each input file will generate a folder containing the build in the output directory.

### Examples {#examples}

Here are a few examples of the exported SPA:

- [Demo Slides](https://sli.dev/demo/starter)
- [Composable Vue](https://talks.antfu.me/2021/composable-vue) by [Anthony Fu](https://github.com/antfu)
- More in [Showcases](../resources/showcases)

### Options {#options}

<LinkCard link="features/build-with-pdf" />
<LinkCard link="features/bundle-remote-assets" />

## Hosting {#hosting}

We recommend using `npm init slidev@latest` to scaffold your project, which contains the necessary configuration files for hosting services out-of-the-box.

### GitHub Pages {#github-pages}

To deploy your slides on [GitHub Pages](https://pages.github.com/) via GitHub Actions, follow these steps:

1. In your repository, go to `Settings` > `Pages`. Under `Build and deployment`, select `GitHub Actions`. (Do not choose `Deploy from a branch` and upload the `dist` directory, which is not recommended.)
2. Create `.github/workflows/deploy.yml` with the following content to deploy your slides to GitHub Pages via GitHub Actions.

::: details deploy.yml

```yaml
name: Deploy pages

on:
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'

      - name: Setup @antfu/ni
        run: npm i -g @antfu/ni

      - name: Install dependencies
        run: nci

      - name: Build
        run: nr build --base /${{github.event.repository.name}}/

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

:::

3. Commit and push the changes to your repository. The GitHub Actions workflow will automatically deploy your slides to GitHub Pages every time you push to the `main` branch.
4. You can access your slides at `https://<username>.github.io/<repository-name>/`.

### Netlify

Create `netlify.toml` in your project root with the following content:

::: details netlify.toml

```toml
[build]
publish = 'dist'
command = 'npm run build'

[build.environment]
NODE_VERSION = '20'

[[redirects]]
from = '/*'
to = '/index.html'
status = 200
```

:::

Then go to your [Netlify dashboard](https://netlify.com/) and create a new site with the repository.

### Vercel

Create `vercel.json` in your project root with the following content:

::: details vercel.json

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

:::

Then go to your [Vercel dashboard](https://vercel.com/) and create a new site with the repository.

### Host on Docker {#docker}

If you need a rapid way to run a presentation with containers, you can use the prebuilt [docker image](https://hub.docker.com/r/tangramor/slidev) maintained by [tangramor](https://github.com/tangramor), or build your own.

::: details Use the Docker Image

Just run the following command in your work folder:

```bash
docker run --name slidev --rm -it \
    --user node \
    -v ${PWD}:/slidev \
    -p 3030:3030 \
    -e NPM_MIRROR="https://registry.npmmirror.com" \
    tangramor/slidev:latest
```

**_Note_**: You can use `NPM_MIRROR` to specify a npm mirror to speed up the installation process.

If your work folder is empty, it will generate a template `slides.md` and other related files under your work folder, and launch the server on port `3030`.

You can access your slides from `http://localhost:3030/`

To create an Docker Image for your slides, you can use the following Dockerfile:

```Dockerfile
FROM tangramor/slidev:latest

ADD . /slidev
```

Create the docker image: `docker build -t myslides .`

And run the container: `docker run --name myslides --rm --user node -p 3030:3030 myslides`

You can visit your slides at `http://localhost:3030/`

:::
