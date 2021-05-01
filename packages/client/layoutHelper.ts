import { CSSProperties } from 'vue'

export function handleBackground(background?: string, dim = false): CSSProperties {
  const isColor = background && background[0] === '#' && background.startsWith('rgb')

  const style = {
    background: isColor
      ? background
      : undefined,
    color: (background && !isColor)
      ? 'white'
      : undefined,
    backgroundImage: isColor
      ? undefined
      : background
        ? dim
          ? `linear-gradient(#0005, #0008), url(${background})`
          : `url("${background}")`
        : undefined,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }

  if (!style.background)
    delete style.background

  return style
}
