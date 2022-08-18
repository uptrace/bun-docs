<template>
  <div>
    <div class="system-bar system-bar--fixed">
      <div class="spacer"></div>

      <div v-if="link" class="d-none d-sm-block">
        <span class="emoji">&#9889;</span>
        <a :href="link.href" :target="link.href.startsWith('/') ? '_self' : '_blank'">{{
          link.text
        }}</a>
      </div>

      <div class="spacer"></div>

      <div class="links">
        <a href="https://uptrace.dev/get/" target="_blank">Tracing tool</a>
        <a href="https://bunrouter.uptrace.dev/" target="_blank">Golang HTTP router</a>
        <a href="https://clickhouse.uptrace.dev/" target="_blank">Golang ClickHouse</a>
        <a href="https://uptrace.dev/blog/" target="_blank">Blog</a>
      </div>
    </div>
    <Layout>
      <template #page-bottom>
        <div
          class="theme-default-content d-flex justify-space-between"
          style="padding-top: 40px; padding-bottom: 0"
        >
          <div>
            <a href="https://uptrace.dev/" target="_blank" title="Distributed tracing tool">
              <img src="/uptrace/logo-text.svg" style="width: 200px" />
            </a>
          </div>
          <div>
            <ClientOnly>
              <Newsletter />
            </ClientOnly>
          </div>
        </div>
      </template>
    </Layout>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'

import Newsletter from '../../components/Newsletter.vue'

interface Link {
  text: string
  href: string
}

export default {
  components: {
    Layout,
    Newsletter,
  },

  setup() {
    const link = ref<Link>()

    onMounted(() => {
      link.value = randLink()

      setInterval(() => {
        link.value = randLink(link.value.href)
      }, 10000)
    })

    function randLink(currHref = '') {
      const links = [
        {
          text: 'Monitoring cache stats using OpenTelemetry Metrics',
          href: 'https://uptrace.dev/opentelemetry/opentelemetry-metrics-cache-stats.html',
        },
        {
          text: 'BunRouter is an extremely fast and flexible HTTP router',
          href: 'https://bunrouter.uptrace.dev/',
        },
        {
          text: 'Tuning PostgreSQL performance for production',
          href: '/postgres/performance-tuning.html',
        },
        {
          text: 'Getting started with Gin, GORM, OpenTelemetry, and Uptrace',
          href: 'https://uptrace.dev/get/opentelemetry-gin-gorm.html',
        },
        {
          text: '@uptracedev: we tweet about Go, OpenTelemetry, ClickHouse, and more',
          href: 'https://twitter.com/uptracedev',
        },
      ]

      for (let i = 0; i < 100; i++) {
        const link = links[Math.floor(Math.random() * links.length)]
        if (link.href !== currHref) {
          return link
        }
      }

      return links[0]
    }

    return { link }
  },
}
</script>

<style lang="scss">
@import '@vuepress/theme-default/lib/client/styles/_variables';

:root {
  --header-height: 6rem;
}

.navbar {
  top: 2.4rem;
}

.home,
.page {
  padding-top: var(--header-height);
}

.sidebar {
  top: var(--header-height);
}

@media (max-width: $MQMobile) {
  .sidebar {
    top: 0;
    padding-top: var(--header-height);
  }
}

h1,
h2,
h3,
h4,
h5,
h6 {
  .theme-default-content:not(.custom) > div > & {
    margin-top: calc(0.5rem - var(--header-height));
    padding-top: calc(1rem + var(--header-height));
  }
}
</style>

<style lang="scss" scoped>
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
  padding-left: 26px;
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

.text-center {
  text-align: center;
}
</style>
