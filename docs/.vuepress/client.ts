import { defineClientConfig, resolvers } from '@vuepress/client'

import Layout from '@/layouts/Layout.vue'

export default defineClientConfig({
  layouts: {
    Layout,
  },

  enhance({ app, router, siteData }) {
    resolvers.resolvePageHeadTitle = (page, siteLocale) => page.title
  },
})
