import { computed } from 'vue-demi'
import { useData } from 'vitepress'
import type { DefaultTheme } from '../config'

export const platforms = ['GitHub', 'GitLab', 'Bitbucket'].map((platform) => {
  return [platform, new RegExp(platform, 'i')] as const
})

export function useRepo() {
  const {site} = useData()

  return computed(() => {
    const theme = site.value.themeConfig as DefaultTheme.Config
    const name = theme.docsRepo || theme.repo

    if (!name)
      return null

    const link = getRepoUrl(name)
    const text = getRepoText(link, theme.repoLabel)

    return { text, link }
  })
}

function getRepoUrl(repo: string): string {
  // if the full url is not provided, default to GitHub repo
  return /^https?:/.test(repo) ? repo : `https://github.com/${repo}`
}

function getRepoText(url: string, text?: string): string {
  if (text)
    return text

  // if no label is provided, deduce it from the repo url
  const hosts = url.match(/^https?:\/\/[^/]+/)

  if (!hosts)
    return 'Source'

  const platform = platforms.find(([, re]) => re.test(hosts[0]))

  if (platform && platform[0])
    return platform[0]

  return 'Source'
}
