# Configure Pre-Parser

::: info
Custom pre-parsers are not supposed to be used too often. Usually you can use [Transformers](./config-transformers) for custom syntaxes.
:::

Slidev parses your presentation file (e.g. `slides.md`) in three steps:

1. A "preparsing" step is carried out: the file is split into slides using the `---` separator, and considering the possible frontmatter blocks.
2. Each slide is parsed with an external library.
3. Slidev resolves the special frontmatter property `src: ....`, which allows to include other md files.

## Markdown Parser

Configuring the markdown parser used in step 2 can be done by [configuring Vite internal plugins](/custom/config-vite#configure-internal-plugins).

## Preparser Extensions

> Available since v0.37.0.

::: warning
Important: when modifying the preparser configuration, you need to stop and start Slidev again (restart might not be sufficient).
:::

The preparser (step 1 above) is highly extensible and allows you to implement custom syntaxes for your md files. Extending the preparser is considered **an advanced feature** and is susceptible to breaking [editor integrations](../features/side-editor) due to implicit changes in the syntax.

To customize it, create a `./setup/preparser.ts` file with the following content:

```ts twoslash [./setup/preparser.ts]
import { definePreparserSetup } from '@slidev/types'

export default definePreparserSetup(({ filepath, headmatter, mode }) => {
  return [
    {
      transformRawLines(lines) {
        for (const i in lines) {
          if (lines[i] === '@@@')
            lines[i] = 'HELLO'
        }
      },
    }
  ]
})
```

This example systematically replaces any `@@@` line with a line with `hello`. It illustrates the structure of a preparser configuration file and some of the main concepts the preparser involves:

- `definePreparserSetup` must be called with a function as parameter.
- The function receives the file path (of the root presentation file), the headmatter (from the md file) and, since v0.48.0, a mode (dev, build or export). It could use this information (e.g., enable extensions based on the presentation file or whether we are exporting a PDF).
- The function must return a list of preparser extensions.
- An extension can contain:
  - a `transformRawLines(lines)` function that runs just after parsing the headmatter of the md file and receives a list of all lines (from the md file). The function can mutate the list arbitrarily.
  - a `transformSlide(content, frontmatter)` function that is called for each slide, just after splitting the file, and receives the slide content as a string and the frontmatter of the slide as an object. The function can mutate the frontmatter and must return the content string (possibly modified, possibly `undefined` if no modifications have been done).
  - a `transformNote(note, frontmatter)` function that is called for each slide, just after splitting the file, and receives the slide note as a string or undefined and the frontmatter of the slide as an object. The function can mutate the frontmatter and must return the note string (possibly modified, possibly `undefined` if no modifications have been done).
  - a `name`

## Example Preparser Extensions

### Use case 1: compact syntax top-level presentation

Imagine a situation where (part of) your presentation is mainly showing cover images and including other md files. You might want a compact notation where for instance (part of) `slides.md` is as follows:

<!-- eslint-skip -->

```md
@cover: /nice.jpg
# Welcome
@src: page1.md
@src: page2.md
@cover: /break.jpg
@src: pages3-4.md
@cover: https://cover.sli.dev
# Questions?
see you next time
```

To allow these `@src:` and `@cover:` syntaxes, create a `./setup/preparser.ts` file with the following content:

```ts twoslash [./setup/preparser.ts]
import { definePreparserSetup } from '@slidev/types'

export default definePreparserSetup(() => {
  return [
    {
      transformRawLines(lines) {
        let i = 0
        while (i < lines.length) {
          const l = lines[i]
          if (l.match(/^@cover:/i)) {
            lines.splice(
              i,
              1,
              '---',
              'layout: cover',
              `background: ${l.replace(/^@cover: */i, '')}`,
              '---',
              ''
            )
            continue
          }
          if (l.match(/^@src:/i)) {
            lines.splice(
              i,
              1,
              '---',
              `src: ${l.replace(/^@src: */i, '')}`,
              '---',
              ''
            )
            continue
          }
          i++
        }
      }
    },
  ]
})
```

And that's it.

### Use case 2: using custom frontmatter to wrap slides

Imagine a case where you often want to scale some of your slides but still want to use a variety of existing layouts so creating a new layout would not be suited.
For instance, you might want to write your `slides.md` as follows:

<!-- eslint-skip -->

```md
---
layout: quote
_scale: 0.75
---

# Welcome

> great!

---
_scale: 4
---
# Break

---

# Ok

---
layout: center
_scale: 2.5
---
# Questions?
see you next time
```

Here we used an underscore in `_scale` to avoid possible conflicts with existing frontmatter properties (indeed, the case of `scale`, without underscore would cause potential problems).

To handle this `_scale: ...` syntax in the frontmatter, create a `./setup/preparser.ts` file with the following content:

```ts twoslash [./setup/preparser.ts]
import { definePreparserSetup } from '@slidev/types'

export default definePreparserSetup(() => {
  return [
    {
      async transformSlide(content, frontmatter) {
        if ('_scale' in frontmatter) {
          return [
            `<Transform :scale=${frontmatter._scale}>`,
            '',
            content,
            '',
            '</Transform>'
          ].join('\n')
        }
      },
    },
  ]
})
```

And that's it.

### Use case 3: using custom frontmatter to transform note

Imagine a case where you want to replace the slides default notes with custom notes.
For instance, you might want to write your `slides.md` as follows:

<!-- eslint-skip -->

```md
---
layout: quote
_note: notes/note.md
---

# Welcome

> great!

<!--
Default slide notes
-->
```

Here we used an underscore in `_note` to avoid possible conflicts with existing frontmatter properties.

To handle this `_note: ...` syntax in the frontmatter, create a `./setup/preparser.ts` file with the following content:

```ts twoslash [./setup/preparser.ts]
import fs, { promises as fsp } from 'node:fs'
import { definePreparserSetup } from '@slidev/types'

export default definePreparserSetup(() => {
  return [
    {
      async transformNote(note, frontmatter) {
        if ('_note' in frontmatter && fs.existsSync(frontmatter._note)) {
          try {
            const newNote = await fsp.readFile(frontmatter._note, 'utf8')
            return newNote
          }
          catch (err) {
          }
        }

        return note
      },
    },
  ]
})
```
