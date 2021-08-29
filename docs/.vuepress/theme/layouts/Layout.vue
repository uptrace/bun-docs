<template>
  <div>
    <div class="system-bar system-bar--fixed">
      <div class="spacer"></div>

      <a href="https://uptrace.dev/" target="_blank">Tracing tool</a>
      <a href="https://redis.uptrace.dev/" target="_blank">Redis client</a>
      <a href="https://blog.uptrace.dev/" target="_blank">Blog</a>
    </div>
    <Layout></Layout>
  </div>
</template>

<script>
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'

export default {
  components: {
    Layout,
  },
}
</script>

<style lang="scss">
:root {
  --header-height: 6rem;
}

.navbar {
  top: 2.4rem;
}
</style>

<style lang="scss" scoped>
.system-bar {
  display: flex;
  align-items: center;
  padding-right: 24px;
  text-align: right;

  background-color: #212121;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;

  ::v-deep(a) {
    display: inline-block;
    padding-left: 32px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 700;

    &:hover {
      color: #fff;
    }
  }
}

.system-bar--fixed {
  position: fixed;
  width: 100%;
  height: 2.4rem;
  top: 0;
  right: 0;
  z-index: 20;
}

.spacer {
  flex-grow: 1 !important;
}
</style>
