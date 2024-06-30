# Static Hosting

## Build Single Page Applications (SPA)

You can build the slides into a self-hostable SPA:

```bash
$ slidev build
```

The generated application will be available under `dist/`.

You can test the generated build using a web server (Apache, NGINX, Caddy...etc.) or in the project you can directly run: `npx vite preview`.

Then you can host it on [GitHub Pages](https://pages.github.com/), [Netlify](https://netlify.app/), [Vercel](https://vercel.com/), or whatever other web server or service that you want. Now you can share your slides with the rest of the world with a single link.

### Base Path

To deploy your slides under sub-routes, you will need to pass the `--base` option. The `--base` path **must begin and end** with a slash `/`; for example:

```bash
$ slidev build --base /talks/my-cool-talk/
```

Refer to [Vite's documentation](https://vitejs.dev/guide/build.html#public-base-path) for more details.

### Provide a Downloadable PDF

You can provide a downloadable PDF to the viewers of your SPA with the following config:

```md
---
download: true
---
```

Slidev will generate a PDF file along with the build, and a download button will be displayed in the SPA.

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

When using the download option, you can also provide the export options:

- By using [CLI export options](/guide/exporting.html)
- Or [frontmatter export options](/custom/#frontmatter-configures)

### Output directory

You can change the output directory using `--out`.

```bash
$ slidev build --out my-build-folder
```

### Watch mode

By passing the `--watch` option the build will run in watch mode and will rebuild anytime the source changes.

```bash
$ slidev build --watch
```

### Multiple entries

You can build multiple slide decks at once.

```bash
$ slidev build slides1.md slides2.md
```

Or

```bash
$ slidev build *.md
```

In this case, each input file will generate a folder containing the build in the output directory.

## Examples

Here are a few examples of the exported SPA:

- [Starter Template](https://sli.dev/demo/starter)
- [Composable Vue](https://talks.antfu.me/2021/composable-vue) by [Anthony Fu](https://github.com/antfu)

For more, check out [Showcases](/showcases).

## Hosting

We recommend using `npm init slidev@latest` to scaffold your project, which contains the necessary configuration files for hosting services out-of-the-box.

### Netlify

- [Netlify](https://netlify.com/)

Create `netlify.toml` in your project root with the following content.

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

Then go to your Netlify dashboard and create a new site with the repository.

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

Then go to your Vercel dashboard and create a new site with the repository.

### GitHub Pages

- [GitHub Pages](https://pages.github.com/)

To deploy your slides on GitHub Pages:

- upload all the files of the project in your repo (i.e. named `name_of_repo`)
- create `.github/workflows/deploy.yml` with the following content to deploy your slides to GitHub Pages via GitHub Actions.

```yaml
name: Deploy pages

on:
  workflow_dispatch: {}
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build -- --base /${{github.event.repository.name}}/

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- In your repository, go to Settings>Pages. Under "Build and deployment", select "GitHub Actions".
- Finally, after all workflows are executed, a link to the slides should appear under Settings>Pages.

## Host on Docker

If you need a rapid way to run a presentation with containers, you can use the prebuilt [docker](https://hub.docker.com/r/tangramor/slidev) image maintained by [tangramor](https://github.com/tangramor), or build your own.

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

### Build deployable images

You can create your own slidev project as a docker image with Dockerfile:

```Dockerfile
FROM tangramor/slidev:latest

ADD . /slidev
```

Create the docker image: `docker build -t myppt .`

And run the container: `docker run --name myslides --rm --user node -p 3030:3030 myppt`

You can visit your slides at `http://localhost:3030/`

### Build hostable SPA (Single Page Application)

Run `docker exec -i slidev npx slidev build` on the running container `slidev`. It will generate static HTML files under `dist` folder.

#### Host on Github Pages

You can host `dist` as a static website via services such as [GitHub Pages](https://tangramor.github.io/slidev_docker/) or GitLab Pages.

Since in GitHub Pages the URL may contain subfolders, you may use `--base=/<subfolder>/` option during the build process, such as `docker exec -i slidev npx slidev build --base=/slidev_docker/`.

To avoid the Jekyll build process, you'll need to add an empty file `.nojekyll`.

#### Host via docker

You can also host Slidev yourself via docker:

```bash
docker run --name myslides --rm -p 80:80 -v ${PWD}/dist:/usr/share/nginx/html nginx:alpine
```

Or create a static image with the following Dockerfile:

```Dockerfile
FROM nginx:alpine

COPY dist /usr/share/nginx/html
```

Create the docker image: `docker build -t mystaticppt .`

And run the container: `docker run --name myslides --rm -p 80:80 mystaticppt`

You can visit your slides at http://localhost/

Refer to [tangramor/slidev_docker](https://github.com/tangramor/slidev_docker) for more details.
