<template>
  <div>
    <div class="system-bar system-bar--fixed">
      <div class="spacer"></div>

      <div class="d-none d-sm-block">
        <span class="emoji">&#9889;</span>
        <a :href="link.href" :target="link.href.startsWith('/') ? '_self' : '_blank'">{{
          link.text
        }}</a>
      </div>

      <div class="spacer"></div>

      <div class="links">
        <a href="https://uptrace.dev/" target="_blank">Tracing & Metrics</a>
        <a href="https://redis.uptrace.dev/" target="_blank">Redis client</a>
        <a href="https://blog.uptrace.dev/" target="_blank">Blog</a>
      </div>
    </div>
    <Layout></Layout>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'

export default {
  components: {
    Layout,
  },

  setup() {
    const link = ref(randLink())

    onMounted(() => {
      setInterval(() => {
        link.value = randLink()
      }, 30000)
    })

    function randLink() {
      const links = [
        {
          text: 'Monitoring cache stats using OpenTelemetry Metrics',
          href: 'https://blog.uptrace.dev/posts/opentelemetry-metrics-cache-stats.html',
        },
        {
          text: 'Get latest updates right to your email',
          href: 'https://blog.uptrace.dev/pages/newsletter.html',
        },
        {
          text: 'Running PostgreSQL on ZFS and AWS',
          href: 'https://bun.uptrace.dev/postgres/tuning-zfs-aws-ebs.html',
        },
        {
          text: 'Soft deletes via Bun models or PostgreSQL views',
          href: '/guide/soft-deletes.html',
        },
        {
          text: 'Running Bun in production using PostgreSQL',
          href: '/postgres/running-bun-in-production.html',
        },
        {
          text: 'BunRouter is an extremely fast and flexible HTTP router',
          href: 'https://bunrouter.uptrace.dev/',
        },
      ]

      return links[Math.floor(Math.random() * links.length)]
    }

    return { link }
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
    text-decoration: underline;
  }
}

.emoji {
  font-size: 1.1rem;
  padding-right: 6px;
}
</style>
