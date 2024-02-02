# Use Theme

Changing the theme in Slidev is surprisingly easy. All you need to do is to add the `theme:` field in your frontmatter.

```yaml
---
theme: seriph
---
```

> **Note**
> To install a theme from a scoped package, you will have to give the full namespace e.g `@organization/slidev-theme-name`

You can start the server, which will prompt you to install the theme automatically

<div class="language-md">
<pre>
<span class="token keyword">?</span> The theme <span class="token string">"@slidev/theme-seriph"</span> was not found in your project, do you want to install it now? › (Y/n)
</pre>
</div>

or install the theme manually via

```bash
$ npm install @slidev/theme-seriph
```

And that's all, enjoy the new theme! For more details about the usage, you can refer to the theme's README.

Want to share your theme? Learn about [how to write a theme](/themes/write-a-theme).

## Eject Theme

If you want to get full control of the current theme, you can **eject** it to your local file system and modify it as you want. By running the following command

```bash
$ slidev theme eject
```

It will eject the theme you are using currently into `./theme`, and changed your frontmatter to

```yaml
---
theme: ./theme
---
```

This could also be helpful if you want to make a theme based on an existing one. If you do, remember to mention the original theme and the author :)

## Local Theme

As you probably found out from the previous section, you can have a local theme for your project. By having a **relative path** in your theme field.

```yaml
---
theme: ./path/to/theme
---
```

Refer to [how to write a theme](/themes/write-a-theme) for more details.
