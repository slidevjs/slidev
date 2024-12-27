import type { SlidevContextNavFull } from '../composables/useNav'
import type { ScreenshotSession } from './screenshot'
import { sleep } from '@antfu/utils'
import { slideHeight, slideWidth } from '../env'
import { captureDelay, disableTransition } from '../state'
import { snapshotState } from '../state/snapshot'
import { isDark } from './dark'
import { startScreenshotSession } from './screenshot'
import { getSlide } from './slides'

const chromeVersion = window.navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]
export const isScreenshotSupported = chromeVersion ? Number(chromeVersion) >= 94 : false

const initialWait = 100

export class SlideSnapshotManager {
  private _screenshotSession: ScreenshotSession | null = null

  getSnapshot(slideNo: number, isDark: boolean) {
    const id = slideNo + (isDark ? '-dark' : '-light')
    const data = snapshotState.state[id]
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

  private async saveSnapshot(slideNo: number, dataUrl: string, isDark: boolean) {
    if (!__DEV__)
      return false
    const slide = getSlide(slideNo)
    if (!slide)
      return false

    const id = slideNo + (isDark ? '-dark' : '-light')
    const revision = slide.meta.slide.revision
    snapshotState.patch(id, {
      revision,
      image: dataUrl,
    })
  }

  async startCapturing(nav: SlidevContextNavFull) {
    if (!__DEV__)
      return false

    // TODO: show a dialog to confirm

    if (this._screenshotSession) {
      this._screenshotSession.dispose()
      this._screenshotSession = null
    }

    try {
      this._screenshotSession = await startScreenshotSession(
        slideWidth.value,
        slideHeight.value,
      )

      disableTransition.value = true
      nav.go(1, 0, true)

      await sleep(initialWait + captureDelay.value)
      while (true) {
        if (!this._screenshotSession) {
          break
        }
        this.saveSnapshot(
          nav.currentSlideNo.value,
          this._screenshotSession.screenshot(document.getElementById('slide-content')!),
          isDark.value,
        )
        if (nav.hasNext.value) {
          await sleep(captureDelay.value)
          nav.nextSlide(true)
          await sleep(captureDelay.value)
        }
        else {
          break
        }
      }

      // TODO: show a message when done

      return true
    }
    catch (e) {
      console.error(e)
      return false
    }
    finally {
      disableTransition.value = false
      if (this._screenshotSession) {
        this._screenshotSession.dispose()
        this._screenshotSession = null
      }
    }
  }
}

export const snapshotManager = new SlideSnapshotManager()
