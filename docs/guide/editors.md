# Editor Support

Since Slidev is using Markdown as the source entry, you can use ANY editors you love to write it.

If you want some high-level management to your slides, we have provided the following editor integrations for you!

## Integrated Editor

Slidev comes with an integrated [CodeMirror](https://codemirror.net/) editor that will instantly reload and save the changes to your file.

Click the <carbon-edit class="inline-icon-btn"/> button to open it.

![](/screenshots/integrated-editor.png)

## VS Code Extension

<p align="center">
    <a href="https://github.com/slidevjs/slidev" target="_blank">
        <img src="https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/logo-for-vscode.png" alt="Slidev" width="300"/>
    </a>
    <br>
    <a href="https://marketplace.visualstudio.com/items?itemName=antfu.slidev" target="__blank">
        <img src="https://img.shields.io/visual-studio-marketplace/v/antfu.slidev.svg?color=4EC5D4&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" />
    </a>
    &nbsp;
    <a href="https://marketplace.visualstudio.com/items?itemName=antfu.slidev" target="__blank">
        <img src="https://img.shields.io/visual-studio-marketplace/d/antfu.slidev.svg?color=2B90B6" alt="Visual Studio Marketplace Downloads" />
    </a>
</p>

The VS Code extension provides some features to help you better organize your slides and have a quick overview of them.

### Features

- Preview slides in the side panel
- Slides tree view
- Re-ordering slides
- Folding for slide blocks
- Multiple slides project support
- Start dev server in one click

![](https://github.com/slidevjs/slidev/assets/63178754/2c9ba01a-d21f-4b33-b6b6-4e249873f865)

::: code-group

<TheTweet id="1395333405345148930" />

<TheTweet id="1789684139152810151" />

:::

### Installation

You can install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=antfu.slidev).

### Usage

Click the `Slidev` icon in the activity bar to open the **Slidev panel**. In the Slidev panel, you can see the projects tree view, slides tree view, and the preview webview.

In the **projects tree view**, you can see all the Slidev projects in your workspace. You can dlick the item to open the corresponding file, and click the <codicon-eye /> icon over it to switch the active project. The <codicon-add /> icon allows you to load a slides project that wasn't scanned automatically.

In the **slides tree view**, you can see all the slides in the active project. You can click the item to move you cursor to the slide in the editor, and drag and drop to reorder the slides.

In the **preview webview**, you can click the <codicon-run-all /> icon to start the dev server and click the <codicon-globe /> icon to open the slides in the browser. Toggle <codicon-lock /> icon to sync/unsync the preview navigation with the editor cursor.

There are also some **commands** you can use. Type `Slidev` in the command palette to see them.

## Prettier Plugin

Slidev also provides a Prettier plugin to format your slides. You can use it with your favorite editor that supports Prettier. Docs for the plugin can be found [here](https://github.com/slidevjs/prettier-plugin).
