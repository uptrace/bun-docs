<template>
  <el-card :key="mounted" class="box-card">
    <div class="cta">
      <div>
        <a href="https://uptrace.dev/open-source" target="_blank">Uptrace</a> is an open source and
        blazingly fast <strong>distributed tracing</strong> backend powered by OpenTelemetry and
        ClickHouse.
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
