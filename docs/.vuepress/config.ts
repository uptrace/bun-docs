import path from 'path'

import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

import { navbar, sidebar } from './configs'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'en-US',
  title: 'Bun',
  description: 'Simple and performant ORM for PostgreSQL, MySQL, and SQLite',

  themeConfig: {
    logo: '/hero/logo.png',

    locales: {
      '/': {
        navbar: navbar.en,
        sidebar: sidebar.en,
        editLinkText: 'Edit this page on GitHub',
      },
    },

    themePlugins: {
      git: false,
    },
  },

  evergreen: process.env.NODE_ENV !== 'production',

  markdown: {
    code: {
      lineNumbers: false,
    },
  },
  extendsMarkdown: (md) => {
    md.use(require('markdown-it-include'), {
      getRootDir: (options, state, startLine, endLine) => {
        let relPath = state.env.filePathRelative
        if (!relPath) {
          return path.resolve(__dirname, '..')
        }

        const i = relPath.lastIndexOf('/')
        relPath = i >= 0 ? relPath.slice(0, i) : ''

        return path.resolve(__dirname, '..', relPath)
      },
    })
  },

  clientAppEnhanceFiles: path.resolve(__dirname, './clientAppEnhance.ts'),
})
