import { computed } from 'vue-demi'
import { useSiteDataByRoute, usePageData } from 'vitepress'
import { endingSlashRE, isNullish, isExternal } from '../utils'

const bitbucketRE = /bitbucket.org/

export function useEditLink() {
  const site = useSiteDataByRoute()
  const page = usePageData()

  const url = computed(() => {
    const showEditLink = isNullish(page.value.frontmatter.editLink)
      ? site.value.themeConfig.editLinks
      : page.value.frontmatter.editLink

    const {
      repo,
      docsDir = '',
      docsBranch = 'main',
      docsRepo = repo,
    } = site.value.themeConfig

    const { relativePath } = page.value

    if (!showEditLink || !relativePath || !repo)
      return null

    return createUrl(repo, docsRepo, docsDir, docsBranch, relativePath)
  })

  const text = computed(() => {
    return site.value.themeConfig.editLinkText || 'Edit this page'
  })

  return {
    url,
    text,
  }
}

function createUrl(
  repo: string,
  docsRepo: string,
  docsDir: string,
  docsBranch: string,
  path: string,
): string {
  return bitbucketRE.test(repo)
    ? createBitbucketUrl(repo, docsRepo, docsDir, docsBranch, path)
    : createGitHubUrl(repo, docsRepo, docsDir, docsBranch, path)
}

function createGitHubUrl(
  repo: string,
  docsRepo: string,
  docsDir: string,
  docsBranch: string,
  path: string,
): string {
  const base = isExternal(docsRepo)
    ? docsRepo
    : `https://github.com/${docsRepo}`

  return (
    `${base.replace(endingSlashRE, '')
    }/edit`
    + `/${docsBranch}/${
      docsDir ? `${docsDir.replace(endingSlashRE, '')}/` : ''
    }${path}`
  )
}

function createBitbucketUrl(
  repo: string,
  docsRepo: string,
  docsDir: string,
  docsBranch: string,
  path: string,
): string {
  const base = isExternal(docsRepo) ? docsRepo : repo

  return (
    `${base.replace(endingSlashRE, '')
    }/src`
    + `/${docsBranch}/${
      docsDir ? `${docsDir.replace(endingSlashRE, '')}/` : ''
    }${path
    }?mode=edit&spa=0&at=${docsBranch}&fileviewer=file-view-default`
  )
}
