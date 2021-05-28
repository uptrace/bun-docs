<template>
  <div style="margin-top: 30px; margin-bottom: 30px">
    <h3>Convert any SELECT query to Bun's SelectQuery</h3>

    <el-row style="margin-bottom: 1rem">
      <el-col>
        With the help of
        <a href="https://uptrace.dev/?utm_source=bun" target="_blank">Uptrace</a>, you can convert
        the provided <code>SELECT</code> query to the equivalent
        <code>bun.SelectQuery</code> expression.
      </el-col>
    </el-row>

    <el-row>
      <el-col>
        <el-input
          type="textarea"
          v-model="query"
          :autosize="{ minRows: 12, maxRows: 12 }"
          style="margin: 0.85rem 0"
        ></el-input>
      </el-col>
    </el-row>

    <el-row>
      <el-col class="text-center">
        <i :class="icon"></i>
        <i :class="icon"></i>
        <i :class="icon"></i>
      </el-col>
    </el-row>

    <el-row>
      <el-col>
        <prism language="go">{{ code }}</prism>
      </el-col>
    </el-row>

    <template v-if="verbose">
      <el-row>
        <el-col class="text-center">
          <i :class="icon"></i>
          <i :class="icon"></i>
          <i :class="icon"></i>
        </el-col>
      </el-row>

      <el-row>
        <el-col>
          <prism language="sql">{{ formattedQuery }}</prism>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import { useFetch } from '@vueuse/core'

import Prism from './Prism'

export default defineComponent({
  name: 'BunPlayground',
  components: { Prism },

  props: {
    verbose: {
      type: Boolean,
      default: false,
    },
  },

  setup() {
    const loading = ref(false)
    const data = ref()
    const query = ref(defaultQuery)

    const code = computed(() => {
      return data.value?.bun ?? ''
    })

    const formattedQuery = computed(() => {
      return data.value?.query ?? ''
    })

    const icon = computed(() => {
      return loading.value ? ['icon', 'el-icon-loading'] : ['icon', 'el-icon-bottom']
    })

    watch(
      query,
      (query) => {
        loading.value = true
        postData('https://api.uptrace.dev/api/v1/bun/queries', { query })
          .then((json) => {
            data.value = json
          })
          .finally(() => {
            loading.value = false
          })
      },
      { immediate: true },
    )

    return { loading, query, code, formattedQuery, icon }
  },
})

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

const defaultQuery = `WITH regional_sales AS (
    SELECT region, SUM(amount) AS total_sales
    FROM orders
    GROUP BY region
), top_regions AS (
    SELECT region
    FROM regional_sales
    WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)
)
SELECT region,
       product,
       SUM(quantity) AS product_units,
       SUM(amount) AS product_sales
FROM orders
WHERE region IN (SELECT region FROM top_regions)
GROUP BY region, product`
</script>

<style lang="scss" scoped>
.text-center {
  text-align: center;
}

.icon {
  font-size: 20px;
  margin-left: 30px;
  margin-right: 30px;
}
</style>
