<script lang="ts" setup>
import { ref } from 'vue'

const image = ref(randImage())

function randImage(current = '') {
  const images = ['green', 'blue']
  for (let i = 0; i < 100; i++) {
    const image = images[Math.floor(Math.random() * images.length)]
    if (image !== current) {
      return image
    }
  }
  return images[0]
}
</script>

<template>
  <div style="padding-top: 20px">
    <a
      :href="`https://uptrace.dev/?utm_source=bun&utm_campaign=banner-${image}`"
      title="Application and infrastructure performance monitoring"
    >
      <img
        :src="`/uptrace/${image}.png`"
        alt="Distributed tracing, metrics, and errors monitoring"
      />
    </a>
  </div>
</template>
