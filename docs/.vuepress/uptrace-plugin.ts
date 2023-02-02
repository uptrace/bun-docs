import markdownInclude from 'markdown-it-include'

import type { Plugin } from '@vuepress/core'
import { path } from '@vuepress/utils'

const uptracePlugin: Plugin = {
  name: 'plugin-uptrace',
  extendsMarkdown(md) {
    md.use(markdownInclude, {
      getRootDir: (options, state, startLine, endLine) => {
        return path.resolve(__dirname, '..', '..', 'include')
      },
    })

    const rawLinkOpenRule = md.renderer.rules.link_open!
    md.renderer.rules.link_open = (tokens, idx, options, env: MarkdownEnv, self) => {
      rawLinkOpenRule(tokens, idx, options, env, self)

      const token = tokens[idx]
      const hrefIndex = token.attrIndex('href')
      if (hrefIndex < 0) {
        return self.renderToken(tokens, idx, options)
      }

      const rel = token.attrGet('rel')
      if (!rel) {
        return self.renderToken(tokens, idx, options)
      }

      const hrefAttr = token.attrs![hrefIndex]
      const hrefLink = hrefAttr[1]
      if (hrefLink.includes('uptrace.dev')) {
        return self.renderToken(tokens, idx, options)
      }

      token.attrSet('rel', rel + ' nofollow')
      return self.renderToken(tokens, idx, options)
    }
  },
}

module.exports = uptracePlugin
