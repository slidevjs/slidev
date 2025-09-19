# SlidevVideo Controlled Playback

This demo shows how to use the `pause` prop on `<SlidevVideo>` to control playback in steps.

## Example

```vue
<SlidevVideo src="/videos/demo.mp4" :pause="[1, 2, 3, 'end']" />
```

The video will:

1. Pause at **1s**
2. Pause at **2s**
3. Pause at **3s**
4. Pause at the **end**

## Usage

Use `pause` to sync video playback with your slide steps or narration.

```vue
<SlidevVideo src="/videos/pipeline.mp4" :pause="[3, 6, 10, 'end']" />
```
