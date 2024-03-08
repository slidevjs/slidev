# Write an Addon

> Available since v0.32.1

## Capability

An addon can contribute to the following points:

- Global styles (use with caution as it has more role than [themes](/themes/use))
- Provide custom layouts or override the existing one
- Provide custom components or override the existing one
- Extend UnoCSS/Windi CSS configurations
- Configure tools like Monaco and Prism

## Conventions

Addons are published to the NPM registry, and they should follow the conventions below:

- Package name should start with `slidev-addon-`, for example: `slidev-addon-awesome`
- Add `slidev-addon` and `slidev` in the `keywords` field of your `package.json`

## Setup

### Initialization

To create your addon, start by creating a directory with a `package.json` file (you can use `npm init`).

Then, install Slidev dependencies:

```bash
$ npm install -D @slidev/cli
```

### Testing

To set up the testing playground for your addon, you can create an `example.md` file with some content.

And optionally, you can also add some scripts to your `packages.json`

```json
// package.json
{
  "scripts": {
    "dev": "slidev example.md",
    "build": "slidev build example.md",
    "export": "slidev export example.md",
    "screenshot": "slidev export example.md --format png"
  }
}
```

To publish your addon, simply run `npm publish` and you are good to go. There is no build process required (which means you can directly publish `.vue` and `.ts` files, Slidev is smart enough to understand them).

Addon contribution points follow the same conventions as local customization, please refer to [the docs for the naming conventions](/custom/).

## Addon metadata

### Slidev Version

If the addon is relying on a specific feature of Slidev that is newly introduced, you can set the minimal Slidev version required to have your addon working properly:

```json
// package.json
{
  "engines": {
    "slidev": ">=0.32.1"
  }
}
```

If users are using older versions of Slidev, an error will be thrown.
