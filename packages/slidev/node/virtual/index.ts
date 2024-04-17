import { templateConfigs } from './configs'
import { templateLegacyRoutes, templateLegacyTitles } from './deprecated'
import { templateGlobalBottom, templateGlobalTop, templateNavControls } from './global-components'
import { templateLayouts } from './layouts'
import { templateMonacoRunDeps } from './monaco-deps'
import { templateMonacoTypes } from './monaco-types'
import { templatePrintTemplate } from './print-template'
import { templateSetups } from './setups'
import { templateShiki } from './shiki'
import { templateSlideLayers } from './slide-layers'
import { templateSlides } from './slides'
import { templateStyle } from './styles'
import { templateTitleRenderer, templateTitleRendererMd } from './titles'

export const templates = [
  templateShiki,
  templateMonacoTypes,
  templateMonacoRunDeps,
  templateConfigs,
  templateStyle,
  templateGlobalBottom,
  templateGlobalTop,
  templateNavControls,
  templateSlides,
  templateLayouts,
  templateTitleRenderer,
  templateTitleRendererMd,
  templatePrintTemplate,
  templateSlideLayers,
  ...templateSetups,

  // Deprecated
  templateLegacyRoutes,
  templateLegacyTitles,
]
