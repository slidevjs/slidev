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

Click the <carbon-user-avatar class="inline-icon-btn"/> button in the [navigation bar](../guide/ui#navigation-bar) to show your camera view in the presentation. You can drag it to move it, and use the handler on the right bottom corner to resize it. The size and position will persist across reloads.

<TheTweet id="1395006771027120133" />

## Start Recording {#start-recording}

Clicking the <carbon-video class="inline-icon-btn"/> button in the [navigation bar](../guide/ui#navigation-bar) will bring up a dialog for you. Here you can choose to either record your camera output embedded in your slides or to separate them into two video files.

This feature is powered by [RecordRTC](https://github.com/muaz-khan/RecordRTC) and uses the [WebRTC API](https://webrtc.org/).

![](/screenshots/recording.png)
