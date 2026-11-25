---
depends:
  - guide/ui#navigation-bar
relates:
  - RecordRTC: https://github.com/muaz-khan/RecordRTC
  - WebRTC API: https://webrtc.org/
tags: [presenter, tool]
description: |
  Record your presentation with the built-in camera view and recording feature.
---

# Recording

Slidev comes with a built-in camera view and recording feature. They make it simple for you to record your presentation without having to switch between other recording tools while delivering a presentation.

## Camera View {#camera-view}

Click the <carbon-user-avatar class="inline-icon-btn"/> button in the [navigation bar](../guide/ui#navigation-bar) to show your camera view in the presentation. You can drag it to move it, and use the handler on the right bottom corner to resize it. The size and position persist across reloads.

Set a default in the deck headmatter, and override it on any slide. A slide only needs the fields it wants to change. Values are pixels of the slide canvas (the same coordinate system as `canvasWidth`), not the browser window. `position` (or `x`) can also be `top-left`, `top-right`, `bottom-left`, or `bottom-right`, inset 30 canvas pixels from that corner of the slide. The bubble scales with the slide and stays in place when the window resizes.

```yaml
---
camera:
  x: 40
  y: 40
  size: 200
---
```

```yaml
---
camera:
  position: bottom-left
  size: 160
---
```

When `camera` is set on the deck or the slide, dragging the bubble affects that slide until the page reloads. With no `camera` config, dragging still updates the shared position saved in the browser.

Moving to a slide with a different `camera` position eases the bubble into place. Dragging it yourself does not.

<TheTweet id="1395006771027120133" />

## Start Recording {#start-recording}

Clicking the <carbon-video class="inline-icon-btn"/> button in the [navigation bar](../guide/ui#navigation-bar) will bring up a dialog for you. Here you can choose to either record your camera output embedded in your slides or to separate them into two video files.

This feature is powered by [RecordRTC](https://github.com/muaz-khan/RecordRTC) and uses the [WebRTC API](https://webrtc.org/).

![](/screenshots/recording.png)
