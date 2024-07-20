# Theme and Addons

A slides project can have one theme and multiple addons. All of them can provide styles, components, layouts, and other configs to your slides project.

## Use a Theme {#use-theme}

Changing the theme in Slidev is surprisingly easy. All you need to do is to add the `theme` option in your [headmatter](../custom/index#headmatter):

```md
---
theme: seriph
---

# The first slide
```

You can find the list of official themes and community themes in the [Themes Gallery](../resources/theme-gallery).

::: info Theme name convention

- You can also pass a relative or absolute path to a local theme folder, like `../my-theme`
- You can always use the full package name as the theme name
- If the theme is [official](../resources/theme-gallery#official-themes) or is named like `slidev-theme-name`, you can omit the `slidev-theme-` prefix
- For scoped packages like `@org/slidev-theme-name`, the full package name is required

:::

You can start the server and will be prompted to install the theme after a confirmation.

<div class="language-md text-xs pl-6">
<pre style="overflow: hidden; text-wrap: pretty;">
<span class="token keyword">?</span> The theme <span class="token string">"@slidev/theme-seriph"</span> was not found in your project, do you want to install it now? › (Y/n)
</pre>
</div>

or install the theme manually via:

```bash
$ npm install @slidev/theme-seriph
```

And that's all, enjoy the new theme! For more details about the usage, you can refer to the theme's README.

<SeeAlso :links="[
  'features/eject-theme',
]" />

## Use an Addon {#use-addon}

Addons are similar to themes, but they are more flexible and can be used to add extra features to your slides project. You can add multiple addons to your project, and they can be used to add extra features to your slides project.

To use an addon, you can add the `addons` option in your [headmatter](../custom/index#headmatter):

```md
---
addons:
  - excalidraw
  - '@slidev/plugin-notes'
---
```

You can find the list of official addons and community addons in the [Addons Gallery](../resources/addon-gallery).
