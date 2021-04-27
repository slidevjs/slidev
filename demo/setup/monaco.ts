import * as monaco from 'monaco-editor'

export default function setupMonaco() {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
    import { InjectionKey } from 'vue'
    export interface UserInfo { id: number; name: string }
    export const injectKeyUser: InjectionKey<UserInfo> = Symbol()
    `,
    'file:///root/context.ts',
  )
}
