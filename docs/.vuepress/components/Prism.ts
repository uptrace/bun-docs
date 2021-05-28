import { h, defineComponent } from 'vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-sql'

export default defineComponent({
  props: {
    code: {
      type: String,
    },
    inline: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: 'markup',
    },
  },
  setup(props, { slots, attrs }) {
    return () => {
      const defaultSlot = (slots && slots.default && slots.default()) || []
      const code = props.code || (defaultSlot && defaultSlot.length) ? defaultSlot[0].children : ''
      const prismLanguage = Prism.languages[props.language]
      const className = `language-${props.language}`

      if (process.env.NODE_ENV === 'development' && !prismLanguage) {
        throw new Error(
          `Prism component for language "${language}" was not found, did you forget to register it? See all available ones: https://cdn.jsdelivr.net/npm/prismjs/components/`,
        )
      }

      if (props.inline) {
        return h('code', {
          class: ['prism', className],
          innerHTML: Prism.highlight(code, prismLanguage),
        })
      }

      return h(
        'pre',
        {
          ...attrs,
          class: [attrs.class, 'prism', className],
        },
        [
          h('code', {
            ...attrs,
            class: [attrs.class, 'prism', className],
            innerHTML: Prism.highlight(code, prismLanguage),
          }),
        ],
      )
    }
  },
})
