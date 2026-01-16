import { defineClientConfig, resolvers } from '@vuepress/client'

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    resolvers.resolvePageHeadTitle = (page, siteLocale) => page.title
  },
})
