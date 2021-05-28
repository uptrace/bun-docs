import path from 'path'

import * as chokidar from 'chokidar'
import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import { chalk, logger } from '@vuepress/utils'

import { navbar, sidebar } from './configs'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'en-US',
  title: 'Bun',
  description: 'Simple and performant ORM for sql.DB',

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

  onWatched: (_, watchers, restart) => {
    const watcher = chokidar.watch('configs/**/*.ts', {
      cwd: __dirname,
      ignoreInitial: true,
    })
    watcher.on('change', async (file) => {
      logger.info(`file ${chalk.magenta(file)} is modified`)
      await restart()
    })
    watchers.push(watcher)
  },
})
