import { defineClientAppEnhance } from '@vuepress/client'

import { ElRow, ElCol, ElInput } from 'element-plus'
import 'element-plus/packages/theme-chalk/src/base.scss'
import 'element-plus/packages/theme-chalk/src/row.scss'
import 'element-plus/packages/theme-chalk/src/col.scss'
import 'element-plus/packages/theme-chalk/src/input.scss'

export default defineClientAppEnhance(({ app, router }) => {
  app.use(ElRow)
  app.use(ElCol)
  app.use(ElInput)

  router.beforeResolve((to, from, next) => {
    const redirectMap = {
      '/treemux/json-rest-api.html': 'https://blog.uptrace.dev/posts/go-json-rest-api/',
      '/postgres/zfs-aws-ebs.html': '/postgres/tuning-zfs-aws-ebs.md',
      '/postgres/installing-zfs-ubuntu.html': 'https://blog.uptrace.dev/posts/ubuntu-install-zfs/',
    }

    const redirect = redirectMap[to.path]
    if (redirect) {
      window.location.href = redirect
    } else {
      next()
    }
  })
})
