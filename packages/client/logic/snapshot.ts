import { snapshotState } from '../state/snapshot'
import { getSlide } from './slides'

export class SlideSnapshotManager {
  private _capturePromises = new Map<number, Promise<void>>()

  getSnapshot(slideNo: number) {
    const data = snapshotState.state[slideNo]
    if (!data) {
      return
    }
    const slide = getSlide(slideNo)
    if (!slide) {
      return
    }
    if (data?.revision === slide?.meta.slide.revision) {
      return data.image
    }
  }

  async captureSnapshot(slideNo: number, el: HTMLElement, delay = 1000) {
    if (!__DEV__)
      return
    if (this.getSnapshot(slideNo)) {
      return
    }
    if (this._capturePromises.has(slideNo)) {
      await this._capturePromises.get(slideNo)
    }
    const promise = this._captureSnapshot(slideNo, el, delay)
      .finally(() => {
        this._capturePromises.delete(slideNo)
      })
    this._capturePromises.set(slideNo, promise)
    await promise
  }

  private async _captureSnapshot(slideNo: number, el: HTMLElement, delay: number) {
    if (!__DEV__)
      return
    const slide = getSlide(slideNo)
    if (!slide)
      return

    const revision = slide.meta.slide.revision

    // Retry until the slide is loaded
    let retries = 100
    while (retries-- > 0) {
      if (!el.querySelector('.slidev-slide-loading'))
        break
      await new Promise(r => setTimeout(r, 100))
    }

    // Artificial delay for the content to be loaded
    await new Promise(r => setTimeout(r, delay))

    // Capture the snapshot
    const toImage = await import('html-to-image')
    try {
      const dataUrl = await toImage.toPng(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        skipFonts: true,
        cacheBust: true,
        pixelRatio: 1.5,
      })
      if (revision !== slide.meta.slide.revision) {
        // eslint-disable-next-line no-console
        console.info('[Slidev] Slide', slideNo, 'changed, discarding the snapshot')
        return
      }
      snapshotState.patch(slideNo, {
        revision,
        image: dataUrl,
      })
      // eslint-disable-next-line no-console
      console.info('[Slidev] Snapshot captured for slide', slideNo)
    }
    catch (e) {
      console.error('[Slidev] Failed to capture snapshot for slide', slideNo, e)
    }
  }
}

export const snapshotManager = new SlideSnapshotManager()
