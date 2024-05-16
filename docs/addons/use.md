# Use Addon

Addons are sets of additional components, layouts, styles, configurations...etc. that you can use in your presentation.

They are quite similar to [themes](/themes/use), but in general:

- they don't affect the global styles of your slides
- you can use multiple addons in one presentation

To use addons, you have to install them manually via:

```bash
$ npm install [slidev-addon-package1] [slidev-addon-package2]
```

And then declare the addons either in your frontmatter:

```yaml
---
addons:
  - slidev-addon-package1
  - slidev-addon-package2
---
```

Or in your `package.json` file:

```json
// package.json
{
  "slidev": {
    "addons": [
      "slidev-addon-package1",
      "slidev-addon-package2"
    ]
  }
}
```

## Examples

[slidev-addon-qrcode](https://github.com/kravetsone/slidev-addon-qrcode) is an addon that allows you to embed QR codes in your slides.


[slidev-addon-remoji](https://github.com/twitwi/slidev-addon-remoji) is an addon that replaces emoji with icons in your slides for consistency / printing purposes.
