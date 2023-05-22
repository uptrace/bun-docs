import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { path } from '@vuepress/utils'
import { viteBundler } from '@vuepress/bundler-vite'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { searchPlugin } from '@vuepress/plugin-search'
import { sitemapPlugin } from 'vuepress-plugin-sitemap2'
import { seoPlugin } from 'vuepress-plugin-seo2'
import { redirectPlugin } from 'vuepress-plugin-redirect'
import { mdEnhancePlugin } from 'vuepress-plugin-md-enhance'

import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

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

  theme: defaultTheme({
    logo: '/hero/logo.png',
    colorMode: 'light',
    colorModeSwitch: false,
    contributors: false,

    navbar: navbar.en,
    sidebar: sidebar.en,

    docsRepo: 'go-bun/bun-docs',
    docsBranch: 'master',
    docsDir: 'docs',
  }),
  alias: {
    '@': path.resolve(__dirname),
    '@public': path.resolve(__dirname, './public'),
  },

  evergreen: !isProd,
  shouldPreload: false,
  shouldPrefetch: false,

  bundler: viteBundler({
    viteOptions: {
      plugins: [
        AutoImport({
          resolvers: [ElementPlusResolver(), IconsResolver()],
          vueTemplate: true,
        }),

        Components({
          resolvers: [
            IconsResolver({
              enabledCollections: ['ep'],
            }),
            ElementPlusResolver(),
          ],
        }),

        Icons(),
      ],
      ssr: {
        noExternal: ['element-plus'],
      },
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
      customHead(head, page) {
        const keywords = page.frontmatter.keywords
        if (keywords) {
          head.push([
            'meta',
            {
              name: 'keywords',
              content: keywords.join(','),
            },
          ])
        }
      },
    }),
    mdEnhancePlugin(),
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
