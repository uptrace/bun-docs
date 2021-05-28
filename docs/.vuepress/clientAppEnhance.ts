import { defineClientAppEnhance } from '@vuepress/client'

import { ElRow, ElCol, ElInput } from 'element-plus'
import 'element-plus/packages/theme-chalk/src/base.scss'
import 'element-plus/packages/theme-chalk/src/row.scss'
import 'element-plus/packages/theme-chalk/src/col.scss'
import 'element-plus/packages/theme-chalk/src/input.scss'

import BunPlayground from './components/BunPlayground.vue'

export default defineClientAppEnhance(({ app }) => {
  app.use(ElRow)
  app.use(ElCol)
  app.use(ElInput)

  app.component('BunPlayground', BunPlayground)
})
