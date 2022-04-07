<template>
  <el-card :key="mounted" class="box-card">
    <div class="cta">
      <div>
        Still using Jaeger/Sentry? Uptrace is an open source
        <a href="https://get.uptrace.dev/compare/distributed-tracing-tools.html" target="_blank"
          >distributed tracing tool</a
        >
        that uses OpenTelemetry to monitor performance, errors, and logs.
      </div>
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
</style>
