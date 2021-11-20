import { defineClientAppEnhance } from '@vuepress/client'

export default defineClientAppEnhance(({ app, router }) => {
  router.beforeResolve((to, from, next) => {
    const redirectMap = {
      '/treemux/json-rest-api.html': 'https://blog.uptrace.dev/posts/go-json-rest-api.html',
      '/postgres/zfs-aws-ebs.html': '/postgres/tuning-zfs-aws-ebs.html',
      '/postgres/installing-zfs-ubuntu.html':
        'https://blog.uptrace.dev/posts/ubuntu-install-zfs.html',
    }

    const redirect = redirectMap[to.path]
    if (redirect) {
      window.location.href = redirect
    } else {
      next()
    }
  })
})
