# Windi CSS

Since Markdown naturally supports embedded HTML markups. You can style your content the way you want. To provide some convenience, we have [Windi CSS](https://github.com/windicss/windicss) built-in, where you can style directly with class utilities, for example

```html
<div class="grid grids-cols-[100px,1fr] gap-4 pt-4">

### Name

- Item 1
- Item 2

</div>
```

## Configurations

To configure the Windi CSS configuration, you will need to extend it by

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
