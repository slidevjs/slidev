import { templateConfigs } from './configs'
import { templateLegacyRoutes, templateLegacyTitles } from './deprecated'
import { templateGlobalBottom, templateGlobalTop, templateNavControls } from './global-components'
import { templateLayouts } from './layouts'
import { templateMonacoRunDeps } from './monaco-deps'
import { templateMonacoTypes } from './monaco-types'
import { templateSetups } from './setups'
import { templateShiki } from './shiki'
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
  ...templateSetups,

  // Deprecated
  templateLegacyRoutes,
  templateLegacyTitles,
]
