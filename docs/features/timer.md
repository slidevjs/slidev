---
tags: [presenter]
description: Timer for the presenter mode.
---

# Presenter Timer

Slidev provides a timer for the presenter mode. You can start, pause, and reset the timer.

It will show a timer (in stopwatch or countdown mode), and a progress bar in the presenter mode.

## Configuration

You can set the duration of the presentation in the headmatter. Default is `30min`.

```yaml
---
# duration of the presentation, default is '30min'
duration: 30min
# timer mode, can be 'countdown' or 'stopwatch', default is 'stopwatch'
timer: stopwatch
---
```
