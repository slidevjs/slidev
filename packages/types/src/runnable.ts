export type RunResult = {
  type: 'success'
  output: {
    type: 'debug' | 'info' | 'warn' | 'error'
    text: string
  }[]
} | {
  type: 'error'
  message: string
}
