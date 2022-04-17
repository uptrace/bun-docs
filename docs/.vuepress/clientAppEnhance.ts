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

export default defineClientAppEnhance(({ app }) => {
  app.use(ElIcon)
  app.use(ElTag)

  app.use(ElCard)
  app.use(ElForm)
  app.use(ElFormItem)
  app.use(ElInput)
  app.use(ElButton)

  resolvers.resolvePageHeadTitle = (page, siteLocale) => page.title
})
