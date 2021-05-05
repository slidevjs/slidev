# Configure Windi CSS

Markdown naturally supports embedded HTML markups. You can therefore style your content the way you want. To provide some convenience, we have [Windi CSS](https://github.com/windicss/windicss) built-in, so you can style markup directly using class utilities. 

For example:

```html
<div class="grid pt-4 gap-4 grids-cols-[100px,1fr]">

### Name

- Item 1
- Item 2

</div>
```

The [Attributify Mode](https://windicss.org/posts/v30.html#attributify-mode) in [Windi CSS v3.0](https://windicss.org/posts/v30.html) is enabled by default.

## Configurations

To configure Windi CSS, you will need to extend the Windi CSS base configuration.

```ts
import { mergeWindicssConfig, defineConfig } from 'vite-plugin-windicss'
import BaseConfig from '@slidev/client/windi.config'
// or extending from the theme:
/* import BaseConfig from '@slidev/theme-seriph/windi.config' */

export default mergeWindicssConfig(
  BaseConfig,
  defineConfig({
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#42b883'
          }
        }
      }
    }
  })
)
```
