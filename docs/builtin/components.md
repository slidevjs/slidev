# Components

This page lists all the built-in components provided by Slidev. These components can be **directly** used in your slides.

Note that <LinkInline link="guide/theme-addon" /> can provide additional components. To add your own components, see <LinkInline link="guide/component#write" />.

## `Arrow`

Draw an arrow.

### Usage

```md
<Arrow x1="10" y1="20" x2="100" y2="200" />
```

Or:

```md
<Arrow v-bind="{ x1:10, y1:10, x2:200, y2:200 }" />
```

Props:

- `x1` (`string | number`, required): start point x position
- `y1` (`string | number`, required): start point y position
- `x2` (`string | number`, required): end point x position
- `y2` (`string | number`, required): end point y position
- `width` (`string | number`, default: `2`): line width
- `color` (`string`, default: `'currentColor'`): line color
- `two-way` (`boolean`, default: `false`): draw a two-way arrow

## `VDragArrow`

An `Arrow` component that can be dragged.

### Usage

<LinkCard link="features/draggable#draggable-arrow" />

Props not related to position are the same as [the `Arrow` component](#arrow).

## `AutoFitText`

> Experimental

Box inside which the font size will automatically adapt to fit the content. Similar to PowerPoint or Keynote TextBox.

### Usage

```md
<AutoFitText :max="200" :min="100" modelValue="Some text"/>
```

Props:

- `max` (`string | number`, default `100`): Maximum font size
- `min` (`string | number`, default `30`): Minimum font size
- `modelValue` (`string`, default `''`): text content

## `LightOrDark`

Use it to display one thing or another depending on the active light or dark theme.

### Usage

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

## `Link`

Insert a link you can use to navigate to a given slide.

### Usage

```md
<Link to="42">Go to slide 42</Link>
<Link to="42" title="Go to slide 42"/>
<Link to="solutions" title="Go to solutions"/>
```

Props:

- `to` (`string | number`): The path of the slide to navigate to (slides path starts from `1`)
- `title` (`string`): The title to display

One can use a string as `to`, provided the corresponding route exists, e.g.

```md
---
routeAlias: solutions
---

# Now some solutions!
```

## `PoweredBySlidev`

Renders "Powered by Slidev" with a link to the Slidev website.

## `RenderWhen`

Render slots depend on whether the context matches (for example whether we are in presenter view).

### Usage

```md
<RenderWhen context="presenter">This will only be rendered in presenter view.</RenderWhen>
```

Context type: `'main' | 'visible' | 'print' | 'slide' | 'overview' | 'presenter' | 'previewNext'`

Props:

- `context` (`Context | Context[]`): a context or array of contexts you want to check for
  - `'main'`: Render in slides and presenter view (equivalent to ['slide', 'presenter']),
  - `'visible'`: Render the content if it is visible
  - `'print'`: Render in print mode
  - `'slide'`: Render in slides
  - `'overview'`: Render in overview
  - `'presenter'`: Render in presenter view
  - `'previewNext'`: Render in presenter's next slide view

Slots:

- `#default`: Rendered when the context matches
- `#fallback`: Rendered when the context does not match

## `SlideCurrentNo`

Current slide number.

### Usage

```md
<SlideCurrentNo />
```

## `SlidesTotal`

Total number of slides.

### Usage

```md
<SlidesTotal />
```

## `TitleRenderer`

Insert the main title from a slide parsed as HTML.

Titles and title levels get automatically retrieved from the first title element of each slide.

You can override this automatic behavior for a slide by using the front matter syntax:

```yml
---
title: Amazing slide title
level: 2
---
```

### Usage

The `<TitleRenderer>` component is a virtual component you can import with:

```js
import TitleRenderer from '#slidev/title-renderer'
```

Then you can use it with:

```md
<TitleRenderer no="42" />
```

Props:

- `no` (`string | number`): The number of the slide to display the title from (slides starts from `1`)

## `Toc`

Insert a Table Of Content.

If you want a slide to not appear in the `<Toc>` component, you can use the `hideInToc` option in the frontmatter of the slide:

```yml
---
hideInToc: true
---
```

Titles are displayed using the [`<Titles>` component](#titles)

### Usage

```md
<Toc />
```

Props:

- `columns` (`string | number`, default: `1`): The number of columns of the display
- `listClass` (`string | string[]`, default: `''`): Classes to apply to the table of contents list
- `maxDepth` (`string | number`, default: `Infinity`): The maximum depth level of title to display
- `minDepth` (`string | number`, default: `1`): The minimum depth level of title to display
- `mode` (`'all' | 'onlyCurrentTree'| 'onlySiblings'`, default: `'all'`):
  - `'all'`: Display all items
  - `'onlyCurrentTree'`: Display only items that are in current tree (active item, parents and children of active item)
  - `'onlySiblings'`: Display only items that are in current tree and their direct siblings

## `Transform`

Apply scaling or transforming to elements.

### Usage

```md
<Transform :scale="0.5">
  <YourElements />
</Transform>
```

Props:

- `scale` (`number | string`, default `1`): transform scale value
- `origin` (`string`, default `'top left'`): transform origin value

## `Tweet`

Embed a tweet.

### Usage

```md
<Tweet id="20" />
```

Props:

- `id` (`number | string`, required): id of the tweet
- `scale` (`number | string`, default `1`): transform scale value
- `conversation` (`string`, default `'none'`): [tweet embed parameter](https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference)
- `cards` (`'hidden' | 'visible'`, default `'visible'`): [tweet embed parameter](https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference)

## `VAfter`, `VClick` and `VClicks`

<LinkCard link="guide/animations#click-animation" />

## `VSwitch`

Switch between multiple slots based on clicks.

<LinkCard link="guide/animations#enter-leave" />

- If the `unmount` prop is set to `true`, the previous slot will be unmounted when switching to the next slot. Default is `false`.
- Use the `tag` and `childTag` props to change the default tag of the component and its children. Default is `div`.
- Use the `transition` prop to change the transition effect. Default is `false` (disabled).

## `VDrag`

<LinkCard link="features/draggable" />

## `SlidevVideo`

Embed a video.

### Usage

```md
<SlidevVideo v-click autoplay controls>
  <!-- Anything that can go in an HTML video element. -->
  <source src="/myMovie.mp4" type="video/mp4" />
  <source src="/myMovie.webm" type="video/webm" />
  <p>
    Your browser does not support videos. You may download it
    <a href="/myMovie.mp4">here</a>.
  </p>
</SlidevVideo>
```

Check [HTML video element's doc](https://developer.mozilla.org/docs/Web/HTML/Element/Video) to see what can be included in this component's slot.

Props:

- `controls` (`boolean`, default: `false`): show the video controls
- `autoplay` (`boolean | 'once'`, default: `false`):
  - `true` or `'once'`: start the video only once and does not restart it once ended or paused
  - `false`: never automatically start the video (rely on `controls` instead)
- `autoreset` (`'slide' | 'click'`, default: `undefined`):
  - `'slide'`: go back to the start of the video when going back to the slide
  - `'click'`: go back to the start of the video when going back to the component's click turn
- `poster` (`string | undefined`, default: `undefined`):
  - The source of the image to print when the video is not playing.
- `printPoster` (`string | undefined`, default: `undefined`):
  - The override for `poster` when printing.
- `timestamp` (`string | number`, default: `0`):
  - The starting time of the video in seconds.
- `printTimestamp` (`string | number | 'last' | undefined`, default: `undefined`):
  - The override for `timestamp` when printing.

::: warning
When exporting, the video may fail to load because Chromium does not support some video formats. In this case, you can specify the executable path of the browser. See [Chromium executable path](/guide/exporting.html#executable-path) for more information.
:::

## `Youtube`

Embed a YouTube video.

### Usage

```md
<Youtube id="luoMHjh-XcQ" />
```

Props:

- `id` (`string`, required): id of the YouTube video
- `width` (`number`): width of the video
- `height` (`number`): height of the video

You can also make the video start at a specific time if you add `?start=1234` to the id value (where `1234` is seconds),
