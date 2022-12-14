<template>
  <el-card :key="mounted" class="box-card">
    <div class="cta">
      <div>
        Still using <strong>Jaeger/Sentry</strong>? Uptrace is an
        <a href="https://uptrace.dev/get/open-source-apm.html" target="_blank">open source APM</a>
        for OpenTelemetry that you can use to monitor applications and set up alerts to receive
        notifications via email, Slack, Telegram, and more.
      </div>
      <div style="width: 10px"></div>
      <div>
        <a href="https://github.com/uptrace/uptrace" target="_blank">
          <el-button type="primary" href="https://github.com/uptrace/uptrace" target="_blank"
            >View on GitHub</el-button
          >
        </a>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const mounted = ref(false)

    onMounted(() => {
      mounted.value = true
    })

    return { mounted }
  },
}
</script>

<style scoped>
.el-card {
  margin-top: 2em;
  margin-bottom: 1em;
  line-height: 1.8em;
}

.cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

strong {
  font-weight: 500;
}

button {
  font-weight: 600;
}
</style>
