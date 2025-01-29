# Contributing

Excited to hear that you are interested in contributing to this project! Thanks!

## Documentation

Documentation is now being synced from the [`/docs`](https://github.com/slidevjs/slidev/tree/main/docs) folder to the [`slidevjs/docs`](https://github.com/slidevjs/docs) repo.

All Pull Requests for documentation changes should still be made to this repository. Any merged changes will be automatically mirrored to the new documentation repo.

The easiest way to contribute documentation to this project is to follow these steps:

1. [Fork the repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo), for example to `https://github.com/octocat/slidev`, where `octocat` is your GitHub username.
2. Clone the newly forked repo from your GitHub account
3. Create a new branch to add your work to, i.e. `git checkout -b docs/update-contributing-guidelines`
4. Make your changes and commit them
5. Push the branch to your fork
6. Go to [https://github.com/slidevjs/slidev/pulls](https://github.com/slidevjs/slidev/pulls), there should be a "Compare & Pull Request" button, where you can create a PR.

## Setup (in your browser)

You can contribute through a development environment in your browser by clicking the following button:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/slidevjs/slidev)

## Setup (locally)

This project uses [`pnpm`](https://pnpm.io/) to manage the dependencies, install it if you haven't via

```bash
npm i -g pnpm
```

Clone this repo to your local machine and install the dependencies.

```bash
pnpm install
```

## Development

To build all the packages at once, run the following command on the project root

```bash
pnpm build
```

Build with watch mode

```bash
pnpm dev
```

### Run Demo

To run Slidev locally, you can run

```bash
pnpm demo:dev
```

Or with the real-world example `Composable Vue`:

```bash
pnpm demo:composable-vue
```

The server will restart automatically every time the builds get updated.

## Project Structure

### Monorepo

We use monorepo to manage multiple packages

```
packages
  slidev/          - main package entry, holds the code on Node.js side
  client/          - main frontend app
  parser/          - parser for Slidev's extended Markdown format
  create-app/      - scripts and template for `npm init slidev`
  create-theme/    - scripts and template for `npm init slidev-theme`
  vscode/          - the VSCode extension
```

## Code Style

Don't worry about the code style as long as you install the dev dependencies. Git hooks will format and fix them for you on committing.

## Thanks

Thank you again for being interested in this project! You are awesome!
