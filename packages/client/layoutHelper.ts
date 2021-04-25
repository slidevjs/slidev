import { CSSProperties } from 'vue'

export function handleBackground(background?: string, dim = false): CSSProperties {
  const isColor = background && background[0] === '#' && background.startsWith('rgb')

  return {
    background: isColor
      ? background
      : background
        ? undefined
        : 'white',
    color: (background && !isColor)
      ? 'white'
      : undefined,
    backgroundImage: isColor
      ? undefined
      : background
        ? dim
          ? `linear-gradient(#0005, #0008), url(${background})`
          : `url(${background})`
        : undefined,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }
}
