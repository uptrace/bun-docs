import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import { path } from '@vuepress/utils'
const { webpackBundler } = require('@vuepress/bundler-webpack')
const { googleAnalyticsPlugin } = require('@vuepress/plugin-google-analytics')
const { registerComponentsPlugin } = require('@vuepress/plugin-register-components')
const { searchPlugin } = require('@vuepress/plugin-search')
const { sitemapPlugin } = require('vuepress-plugin-sitemap2')
const { seoPlugin } = require('vuepress-plugin-seo2')
const { redirectPlugin } = require('vuepress-plugin-redirect')

import { localTheme } from './theme'
import { navbar, sidebar } from './configs'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'en-US',
  title: 'Bun',
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

  theme: localTheme({
    logo: '/hero/logo.png',
    darkMode: false,
    contributors: false,

    navbar: navbar.en,
    sidebar: sidebar.en,

    docsRepo: 'go-bun/bun-docs',
    docsBranch: 'master',
    docsDir: 'docs',
  }),
  alias: {
    '@public': path.resolve(__dirname, './public'),
  },

  evergreen: !isProd,
  shouldPreload: false,
  shouldPrefetch: false,

  bundler: webpackBundler({
    configureWebpack: (config) => {
      config.module.rules.push({
        test: /\.mjs$/i,
        resolve: { byDependency: { esm: { fullySpecified: false } } },
      })
      return {}
    },
  }),

  markdown: {
    code: {
      lineNumbers: false,
    },
  },

  plugins: [
    googleAnalyticsPlugin({ id: 'G-LQ6F39WC48' }),
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, './components'),
    }),
    searchPlugin(),
    sitemapPlugin({ hostname: 'https://bun.uptrace.dev' }),
    seoPlugin({
      hostname: 'https://bun.uptrace.dev',
      canonical(page) {
        return 'https://bun.uptrace.dev' + page.path
      },
    }),
    redirectPlugin({
      hostname: 'https://bun.uptrace.dev',
      config: {
        '/guide/getting-started.html': '/guide/golang-orm.html',
        '/guide/tracing.html': '/guide/performance-monitoring.html',
        '/guide/sql-performance-monitoring.html': '/guide/performance-monitoring.html',
        '/tracing/index.html': '/guide/performance-monitoring.html',
        '/postgres/uuid.html': '/postgres/postgres-uuid-generate.html',
        '/postgres/data-types.html': '/postgres/postgres-data-types.html',
        '/postgres/arrays.html': '/postgres/postgres-arrays.html',
        '/guide/migrating.html': '/guide/pg-migration.html',
        '/transactions/index.html': '/guide/transactions.html',
        '/queries/index.html': '/guide/queries.html',
        '/uuid/index.html': '/postgres/postgres-uuid-generate.html',

        '/treemux/json-rest-api.html': 'https://uptrace.dev/blog/posts/go-json-rest-api.html',
        '/postgres/zfs-aws-ebs.html': '/postgres/tuning-zfs-aws-ebs.html',
        '/postgres/installing-zfs-ubuntu.html':
          'https://uptrace.dev/blog/posts/ubuntu-install-zfs.html',
        '/postgres/running-bun-in-production.html': '/guide/running-bun-in-production.html',
      },
    }),
    require('./uptrace-plugin'),
  ],
})
