# Components

## Built-in Components

### `Arrow`

Draw an arrow.

#### Usage

```md
<Arrow x1="10" y1="20" x2="100" y2="200" />
```

Or:

```md
<Arrow v-bind="{ x1:10, y1:10, x2:200, y2:200 }" />
```

Parameters:

- `x1` (`string | number`, required): start point x position
- `y1` (`string | number`, required): start point y position
- `x2` (`string | number`, required): end point x position
- `y2` (`string | number`, required): end point x position
- `width` (`string | number`, default: `2`): line width
- `color` (`string`, default: `'currentColor'`): line color

### `AutoFitText`

> Experimental

Box inside which the font size will automatically adapt to fit the content. Similar to PowerPoint or Keynote TextBox.

#### Usage

```md
<AutoFitText :max="200" :min="100" modelValue="Some text"/>
```

Parameters:

- `max` (`string | number`, default `100`): Maximum font size
- `min` (`string | number`, default `30`): Minimum font size
- `modelValue` (`string`, default `''`): text content

### `LightOrDark`

Use it to display one thing or another depending on the active light or dark theme.

#### Usage

Use it with the two named Slots `#dark` and `#light`:

```md
<LightOrDark>
  <template #dark>Dark mode is on</template>
  <template #light>Light mode is on</template>
</LightOrDark>
```

Provided props on `LightOrDark` component will be available using scoped slot props:

```md
<LightOrDark width="100" alt="some image">
  <template #dark="props">
    <img src="/dark.png" v-bind="props"/>
  </template>
  <template #light="props">
    <img src="/light.png" v-bind="props"/>
  </template>
</LightOrDark>
```

You can provide markdown in the slots, but you will need to surround the content with blank lines:

```md
<LightOrDark>
  <template #dark>

![dark](/dark.png)

  </template>
  <template #light>

![light](/light.png)

  </template>
</LightOrDark>
```

### `Link`

Insert a link you can use to navigate to a given slide.

#### Usage

```md
<Link to="42">Go to slide 42</Link>
<Link to="42" title="Go to slide 42"/>
<Link to="solutions" title="Go to solutions"/>
```

Parameters:

- `to` (`string | number`): The path of the slide to navigate to (slides path starts from `1`)
- `title` (`string`): The title to display

One can use a string as `to`, provided the corresponding route exists, e.g.

```md
---
routeAlias: solutions
---

# Now some solutions!
```

### `RenderWhen`

Render slots depending on whether the context matches (for example whether we are in presenter view).

#### Usage

```md
<RenderWhen context="presenter">This will only be rendered in presenter view.</RenderWhen>
```

Context type: `'main' | 'visible' | 'print' | 'slide' | 'overview' | 'presenter' | 'previewNext'`

Parameters:

- `context` (`Context | Context[]`): a context or array of contexts you want to check for
  - `'main'`: Render in slides and presenter view (equivalent to ['slide', 'presenter']),
  - `'visible'`: Render the content if it is visible
  - `'print'`: Render in print mode
  - `'slide'`: Render in slides
  - `'overview'`: Render in overview
  - `'presenter'`: Render in presenter view
  - `'previewNext'`: Render in presenter's next slide view
  - `'previewPrevious'`: Render in presenter's previous slide view

Slots:

- `#default`: Rendered when the context matches
- `#fallback`: Rendered when the context does not match

### `SlideCurrentNo`

Current slide number.

#### Usage

```md
<SlideCurrentNo />
```

### `SlidesTotal`

Total number of slides.

#### Usage

```md
<SlidesTotal />
```

### `Titles`

Insert the main title from a slide parsed as HTML.

Titles and title levels get automatically retrieved from the first title element of each slide.

You can override this automatic behavior for a slide by using the front matter syntax:

```yml
---
title: Amazing slide title
level: 2
---
```

#### Usage

The `<TitleRenderer>` component is a virtual component you can import with:

```js
import TitleRenderer from '#slidev/title-renderer'
```

Then you can use it with:

```md
<TitleRenderer no="42" />
```

Parameters:

- `no` (`string | number`): The number of the slide to display the title from (slides starts from `1`)

### `Toc`

Insert a Table Of Content.

If you want a slide to not appear in the `<Toc>` component, you can use the `hideInToc` option in the frontmatter of the slide:

```yml
---
hideInToc: true
---
```

Titles are displayed using the [`<Titles>` component](#titles)

#### Usage

```md
<Toc />
```

Parameters:

- `columns` (`string | number`, default: `1`): The number of columns of the display
- `listClass` (`string | string[]`, default: `''`): Classes to apply to the table of contents list
- `maxDepth` (`string | number`, default: `Infinity`): The maximum depth level of title to display
- `minDepth` (`string | number`, default: `1`): The minimum depth level of title to display
- `mode` (`'all' | 'onlyCurrentTree'| 'onlySiblings'`, default: `'all'`):
  - `'all'`: Display all items
  - `'onlyCurrentTree'`: Display only items that are in current tree (active item, parents and children of active item)
  - `'onlySiblings'`: Display only items that are in current tree and their direct siblings

### `Transform`

Apply scaling or transforming to elements.

#### Usage

```md
<Transform :scale="0.5">
  <YourElements />
</Transform>
```

Parameters:

- `scale` (`number | string`, default `1`): transform scale value
- `origin` (`string`, default `'top left'`): transform origin value

### `Tweet`

Embed a tweet.

#### Usage

```md
<Tweet id="20" />
```

Parameters:

- `id` (`number | string`, required): id of the tweet
- `scale` (`number | string`, default `1`): transform scale value
- `conversation` (`string`, default `'none'`): [tweet embed parameter](https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference)
- `cards` (`'hidden' | 'visible'`, default `'visible'`): [tweet embed parameter](https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference)

### `VAfter`, `VClick` and `VClicks`

See https://sli.dev/guide/animations.html

### `SlidevVideo`

Embed a video.

#### Usage

```md
<SlidevVideo>
  <!-- Anything that can go in a HTML video element. -->
  <source src="myMovie.mp4" type="video/mp4" />
  <source src="myMovie.webm" type="video/webm" />
  <p>
    Your browser does not support videos. You may download it
    <a href="myMovie.mp4">here</a>.
  </p>
</SlidevVideo>
```

Check [HTML video element's doc](https://developer.mozilla.org/docs/Web/HTML/Element/Video) to see what can be included in this component's slot.

Parameters:

- `autoPlay` (`boolean | 'once' | 'resume' | 'resumeOnce'`, default: `false`):
  - `true` or `'once'`: start the video only once and does not restart it once ended or paused
  - `false`: never automatically start the video (rely on html5 controls instead)
  - `'resume'` resume the video when going back to its click turn
  - `'resumeOnce'` only resume it if it hasn't ended
- `autoPause` (`'slide' | 'click'`, default: `undefined`):
  - `'slide'`: pause the video on slide change
  - `'click'`: pause on next click
- `autoReset` (`'slide' | 'click'`, default: `undefined`):
  - `'slide'`: go back to the start of the video when going back to the slide
  - `'click'`: go back to the start of the video when going back to the component's click turn

### `Youtube`

Embed a YouTube video.

#### Usage

```md
<Youtube id="luoMHjh-XcQ" />
```

Parameters:

- `id` (`string`, required): id of the YouTube video
- `width` (`number`): width of the video
- `height` (`number`): height of the video

You can also make the video start at a specific time if you add `?start=1234` to the id value (where `1234` is seconds),

## Custom Components

Create a directory `components/` under your project root, and simply put your custom Vue components under it, then you can use it with the same name in your markdown file!

Read more in the [Customization](/custom/directory-structure#components) section.

## Theme-provided Components

Themes can provide components as well. Please read their documentation for what they have provided.

Check more in the [directory structure](/custom/directory-structure) section.
