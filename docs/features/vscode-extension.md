---
relates:
  - VS Code: https://code.visualstudio.com/
  - View in Marketplace: https://marketplace.visualstudio.com/items?itemName=antfu.slidev
  - View in OVSX: https://open-vsx.org/extension/antfu/slidev
tags: [editor]
description: |
  Help you better organize your slides and have a quick overview of them.
---

# VS Code Extension

<p align="center">
    <a href="https://github.com/slidevjs/slidev" target="_blank">
        <img src="https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/logo-for-vscode.png" alt="Slidev" width="300" />
    </a>
</p>

<a href="https://marketplace.visualstudio.com/items?itemName=antfu.slidev" target="__blank">
  <img inline src="https://img.shields.io/visual-studio-marketplace/v/antfu.slidev.svg?color=4EC5D4&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" />
</a> &nbsp;
<a href="https://marketplace.visualstudio.com/items?itemName=antfu.slidev" target="__blank">
  <img inline src="https://img.shields.io/visual-studio-marketplace/d/antfu.slidev.svg?color=2B90B6" alt="Visual Studio Marketplace Downloads" />
</a>

The VS Code extension provides some features to help you better organize your slides and have a quick overview of them.

### Features

- Preview slides in the side panel
- Slides tree view
- Re-ordering slides
- Folding for slide blocks
- Multiple slides project support
- Start the dev server with one click

![](https://github.com/slidevjs/slidev/assets/63178754/2c9ba01a-d21f-4b33-b6b6-4e249873f865)

<TheTweet id="1395333405345148930" />

<TheTweet id="1789684139152810151" />

### Installation

You can install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=antfu.slidev) or the [Open VSX Registry](https://open-vsx.org/extension/antfu/slidev).

### Usage

Click the `Slidev` icon in the activity bar to open the **Slidev panel**. In the Slidev panel, you can see the projects tree view, slides tree view, and the preview webview.

In the **projects tree view**, you can see all the Slidev projects in your workspace. You can click the item to open the corresponding file, and click the <codicon-eye /> icon over it to switch the active project. The <codicon-add /> icon allows you to load a slides project that wasn't scanned automatically.

In the **slides tree view**, you can see all the slides in the active project. You can click the item to move your cursor to the slide in the editor, and drag and drop to reorder the slides.

In the **preview webview**, you can click the <codicon-run-all /> icon to start the dev server and click the <codicon-globe /> icon to open the slides in the browser. Toggle <codicon-lock /> icon to sync/unsync the preview navigation with the editor cursor.

There are also some **commands** you can use. Type `Slidev` in the command palette to see them.

You can add glob patterns to the `slidev.include` configuration to include files as Slidev entries. The default value is `["**/*.md"]`. Example:

```json
{
  "slidev.include": ["**/presentation.md"]
}
```

#### Dev Command {#dev-command}

You can customize the command to start dev server by setting the `slidev.dev-command` configuration. The default value is `npm exec -c 'slidev ${args}'`.

The configured command can contain placeholders:

- `${args}`: All CLI arguments. e.g. `slides.md --port 3000 --remote`
- `${port}`: The port number. e.g. `3000`

Examples:

- Global installation: `slidev ${args}`
- For PNPM users, you can set it to `pnpm slidev ${args}`.
- For [code-server](https://coder.com/docs/code-server/) users, you can set it to `pnpm slidev ${args} --base /proxy/${port}/`. This will make the dev server accessible at `http://localhost:8080/proxy/3000/`.
