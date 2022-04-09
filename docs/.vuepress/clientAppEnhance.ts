import { defineClientAppEnhance, resolvers } from '@vuepress/client'

import {
  ElIcon,
  ElTag,

  //
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
} from 'element-plus'

import 'element-plus/es/components/icon/style/css.mjs'
import 'element-plus/es/components/tag/style/css.mjs'

import 'element-plus/es/components/card/style/css.mjs'
import 'element-plus/es/components/form/style/css.mjs'
import 'element-plus/es/components/form-item/style/css.mjs'
import 'element-plus/es/components/input/style/css.mjs'
import 'element-plus/es/components/button/style/css.mjs'

export default defineClientAppEnhance(({ app, router }) => {
  app.use(ElIcon)
  app.use(ElTag)

  app.use(ElCard)
  app.use(ElForm)
  app.use(ElFormItem)
  app.use(ElInput)
  app.use(ElButton)

  resolvers.resolvePageHeadTitle = (page, siteLocale) => page.title

  router.beforeResolve((to, from, next) => {
    const redirectMap = {
      '/treemux/json-rest-api.html': 'https://blog.uptrace.dev/posts/go-json-rest-api.html',
      '/postgres/zfs-aws-ebs.html': '/postgres/tuning-zfs-aws-ebs.html',
      '/postgres/installing-zfs-ubuntu.html':
        'https://blog.uptrace.dev/posts/ubuntu-install-zfs.html',
      '/postgres/running-bun-in-production.html': '/guide/running-bun-in-production.html',
    }

    let path = to.path
    if (!path.endsWith('/')) {
      path += '/'
    }

    const redirect = redirectMap[path]
    if (redirect) {
      window.location.href = redirect
    } else {
      next()
    }
  })
})
