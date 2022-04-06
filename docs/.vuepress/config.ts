import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import { path } from '@vuepress/utils'

import { navbar, sidebar } from './configs'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'en-US',
  title: 'Golang ORM',
  description: 'Lightweight Golang ORM for PostgreSQL, MySQL, MSSQL, and SQLite',

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
    ],
  ],

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
  bundler: '@vuepress/bundler-webpack',
  bundlerConfig: {
    configureWebpack: (config) => {
      config.module.rules.push({
        test: /\.mjs$/i,
        resolve: { byDependency: { esm: { fullySpecified: false } } },
      })
      return {}
    },
  },

  markdown: {
    code: {
      lineNumbers: false,
    },
  },

  plugins: [
    ['@vuepress/plugin-google-analytics', { id: 'G-LQ6F39WC48' }],
    [
      '@vuepress/plugin-register-components',
      {
        componentsDir: path.resolve(__dirname, './components'),
      },
    ],
    ['@vuepress/plugin-search'],
    ['vuepress-plugin-sitemap2', { hostname: 'https://bun.uptrace.dev' }],
    require('./uptrace-plugin'),
  ],
  clientAppEnhanceFiles: path.resolve(__dirname, './clientAppEnhance.ts'),
})
