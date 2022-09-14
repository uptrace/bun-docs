<template>
  <div class="cover" :style="`background-image: url('${image}')`">
    <h1>{{ title }}</h1>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import { withBase } from '@vuepress/client'

export default {
  props: {
    title: {
      type: String,
      required: true,
    },
  },

  setup() {
    const images = ['mesh1.jpg', 'mesh2.jpg', 'mesh3.jpg', 'mesh4.jpg', 'mesh5.jpg']
    const image = pick(images)
    return { image: withBase(`/cover/${image}`) }
  },
}

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)]
}
</script>

<style lang="scss" scoped>
.cover {
  margin-top: 1em;
  height: 300px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  background-color: #1565c0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  border-radius: 10px;

  color: white;
}

h1 {
  margin: 0;
  padding: 0 10px;
}
</style>
