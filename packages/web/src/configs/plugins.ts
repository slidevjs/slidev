import type { SlidevPluginOptions } from '@slidev/types'
import { reactive } from 'vue'
import type { SFCAsyncStyleCompileOptions, SFCScriptCompileOptions, SFCTemplateCompileOptions } from 'vue/compiler-sfc'

// export interface SFCOptions {
//   script?: Partial<SFCScriptCompileOptions>
//   style?: Partial<SFCAsyncStyleCompileOptions>
//   template?: Partial<SFCTemplateCompileOptions>
// }

export const sfcOptions = reactive<NonNullable<SlidevPluginOptions['vue']>>({})

export const mdOptions = reactive<NonNullable<SlidevPluginOptions['markdown']>>({})
