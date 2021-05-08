import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup((monaco) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
    import { InjectionKey } from 'vue'
    export interface UserInfo { id: number; name: string }
    export const injectKeyUser: InjectionKey<UserInfo> = Symbol()
    `,
    'file:///root/context.ts',
  )
})
