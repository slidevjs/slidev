import type { SlidevPluginOptions } from '@slidev/types'
import { reactive } from 'vue'

// export interface SFCOptions {
//   script?: Partial<SFCScriptCompileOptions>
//   style?: Partial<SFCAsyncStyleCompileOptions>
//   template?: Partial<SFCTemplateCompileOptions>
// }

export const sfcOptions = reactive<NonNullable<SlidevPluginOptions['vue']>>({})

export const mdOptions = reactive<NonNullable<SlidevPluginOptions['markdown']>>({})
