<template>
  <div>
    <div class="system-bar system-bar--fixed">
      <div class="spacer"></div>

      <a href="https://uptrace.dev/">Tracing tool</a>
      <a href="https://redis.uptrace.dev/">Redis client</a>
      <a href="https://bun.uptrace.dev/">SQL client</a>
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
.navbar {
  top: 40px;
}

.sidebar {
  top: 94px;
}

.theme-default-content {
  padding-top: 2.5rem !important;
}

.home {
  padding-top: 6rem;
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
  }
}

.system-bar--fixed {
  position: fixed;
  width: 100%;
  height: 40px;
  top: 0;
  right: 0;
  z-index: 20;
}

.spacer {
  flex-grow: 1 !important;
}
</style>
