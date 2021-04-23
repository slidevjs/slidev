/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-namespace */

export namespace DefaultTheme {
  export interface Config {
    logo?: string
    nav?: NavItem[] | false
    sidebar?: SideBarConfig | MultiSideBarConfig

    /**
     * GitHub repository following the format <user>/<project>.
     *
     * @example `"vuejs/vue-next"`
     */
    repo?: string

    /**
     * Customize the header label. Defaults to GitHub/Gitlab/Bitbucket
     * depending on the provided repo.
     *
     * @exampe `"Contribute!"`
     */
    repoLabel?: string

    /**
     * If your docs are in a different repository from your main project.
     *
     * @example `"vuejs/docs-next"`
     */
    docsRepo?: string

    /**
     * If your docs are not at the root of the repo.
     *
     * @example `"docs"`
     */
    docsDir?: string

    /**
     * If your docs are in a different branch. Defaults to `main`.
     *
     * @example `"next"`
     */
    docsBranch?: string

    /**
     * Enable links to edit pages at the bottom of the page.
     */
    editLinks?: boolean

    /**
     * Custom text for edit link. Defaults to "Edit this page".
     */
    editLinkText?: string

    /**
     * Show last updated time at the bottom of the page. Defaults to `false`.
     * If given a string, it will be displayed as a prefix (default value:
     * "Last Updated").
     */
    lastUpdated?: string | boolean

    prevLinks?: boolean
    nextLinks?: boolean

    locales?: Record<string, LocaleConfig & Omit<Config, 'locales'>>
  }

  // navbar --------------------------------------------------------------------

  export type NavItem = NavItemWithLink | NavItemWithChildren

  export interface NavItemBase {
    text: string
    target?: string
    rel?: string
    ariaLabel?: string
    activeMatch?: string
  }

  export interface NavItemWithLink extends NavItemBase {
    link: string
  }

  export interface NavItemWithChildren extends NavItemBase {
    items: NavItemWithLink[]
  }

  // sidebar -------------------------------------------------------------------

  export type SideBarConfig = SideBarItem[] | 'auto' | false

  export interface MultiSideBarConfig {
    [path: string]: SideBarConfig
  }

  export type SideBarItem = SideBarLink | SideBarGroup

  export interface SideBarLink {
    text: string
    link: string
  }

  export interface SideBarGroup {
    text: string
    link?: string

    /**
     * @default false
     */
    collapsable?: boolean

    children: SideBarItem[]
  }

  // locales -------------------------------------------------------------------

  export interface LocaleConfig {
    /**
     * Text for the language dropdown.
     */
    selectText?: string

    /**
     * Label for this locale in the language dropdown.
     */
    label?: string
  }
}
