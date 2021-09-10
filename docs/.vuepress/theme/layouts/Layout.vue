<template>
  <div>
    <div class="system-bar system-bar--fixed">
      <div class="spacer"></div>

      <div class="d-none d-sm-block">
        <span>Blog: </span>
        <a href="https://blog.uptrace.dev/posts/opentelemetry-metrics-cache-stats/" target="_blank"
          >Monitoring cache stats using OpenTelemetry Metrics</a
        >
      </div>

      <div class="spacer"></div>

      <div class="links">
        <a href="https://uptrace.dev/" target="_blank">Tracing tool</a>
        <a href="https://redis.uptrace.dev/" target="_blank">Redis client</a>
        <a href="https://blog.uptrace.dev/" target="_blank">Blog</a>
      </div>
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
.spacer {
  flex-grow: 1 !important;
}

.d-none {
  display: none !important;
}

@media (min-width: 800px) {
  .d-sm-block {
    display: block !important;
  }
}

.system-bar {
  display: flex;
  align-items: center;
  padding-right: 24px;
  text-align: right;

  background-color: #212121;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.system-bar--fixed {
  position: fixed;
  width: 100%;
  height: 2.4rem;
  top: 0;
  right: 0;
  z-index: 20;
}

.links ::v-deep(a) {
  display: inline-block;
  padding-left: 32px;
}

a {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;

  &:hover {
    color: #fff;
  }
}
</style>
