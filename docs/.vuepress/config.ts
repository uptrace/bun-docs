import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import { path } from '@vuepress/utils'

import { navbar, sidebar } from './configs'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'en-US',
  title: 'Bun',
  description: 'Simple and performant DB client for PostgreSQL, MySQL, and SQLite',

  theme: path.resolve(__dirname, './theme'),
  themeConfig: {
    logo: '/hero/logo.png',
    darkMode: false,

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

  evergreen: isProd,

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

  plugins: [
    ['@vuepress/plugin-debug'],
    [
      '@vuepress/plugin-register-components',
      {
        componentsDir: path.resolve(__dirname, './components'),
      },
    ],
  ],
  clientAppEnhanceFiles: path.resolve(__dirname, './clientAppEnhance.ts'),
})
