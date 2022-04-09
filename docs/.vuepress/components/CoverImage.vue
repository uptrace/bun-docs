<template>
  <div class="container" :style="`background-image: url('/cover/${image}') `">
    <div>
      <h1>{{ title }}</h1>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'

export default {
  props: {
    title: {
      type: String,
      required: true,
    },
  },

  setup() {
    const images = ['mesh1.jpg', 'mesh2.jpg', 'mesh3.jpg', 'mesh4.jpg', 'mesh5.jpg']
    return { image: pick(images) }
  },
}

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)]
}
</script>

<style lang="scss" scoped>
.container {
  margin-top: 1em;
  background-color: #1565c0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  border-radius: 10px;
  color: white;
}

h1 {
  padding: 3em 10px;
  text-align: center;
}
</style>
