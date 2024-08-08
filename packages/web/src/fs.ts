import type { Ref } from 'vue'

export interface File {
  type: 'text' | 'binary'
  content: Ref<string> | Ref<ArrayBuffer>
}

export interface Directory {
  name: string
  directories: Directory[]
  files: Record<string, Ref<string>>
}

// const root = reactive({
//   name: '~',
//   directories: [],
//   files: {},
// })

// export function mkdir(path: string) {
//   return reactive({
//     name,
//     directories,
//     files,
//   })
// }
