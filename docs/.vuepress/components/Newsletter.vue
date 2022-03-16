<template>
  <div style="padding-bottom: 8px">Get insights and updates in your inbox:</div>

  <el-form
    v-if="!form.done"
    :key="mounted"
    ref="formRef"
    :model="form.data"
    :rules="form.rules"
    inline
    @submit.prevent.native="form.submit"
  >
    <el-form-item prop="email" style="width: 220px">
      <el-input
        v-model="form.data.email"
        label="Email"
        type="email"
        placeholder="example@domain.com"
      >
      </el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" native-type="submit" :loading="form.loading"> Subscribe </el-button>
    </el-form-item>
  </el-form>
  <el-tag v-else type="success" effect="dark">
    <el-icon class="el-icon--left"><Check /></el-icon>
    Subscribed
  </el-tag>
</template>

<script lang="ts">
import axios from 'axios'
import { Check } from '@element-plus/icons'
import { ref, reactive, onMounted, proxyRefs, Ref } from 'vue'

export default {
  components: { Check },

  setup() {
    const mounted = ref(false)
    const formRef = ref()

    onMounted(() => {
      mounted.value = true
    })

    return { mounted, formRef, form: useForm(formRef) }
  },
}

function useForm(form: Ref) {
  const loading = ref(false)
  const done = ref(false)

  const data = reactive({ email: '' })

  const rules = {
    email: [
      {
        required: true,
        message: 'Please input email',
        trigger: 'blur',
      },
      {
        type: 'email',
        message: 'Please input correct email address',
        trigger: ['blur', 'change'],
      },
    ],
  }

  function submit() {
    form.value.validate((valid) => {
      if (valid) {
        subscribe()
      }
      return valid
    })
  }

  function subscribe() {
    loading.value = true

    axios
      .post('https://api2.uptrace.dev/api/v1/newsletter/subscriptions', {
        topic: 'go',
        email: data.email,
        source: 'bun.uptrace.dev',
      })
      .then(() => {
        done.value = true
      })
      .catch((error) => {
        alert('Oops! Something went wrong. Please try again later.')
      })
      .finally(() => {
        loading.value = false
      })
  }

  return proxyRefs({
    ref: form,
    data,
    rules,

    loading,
    done,

    submit,
  })
}
</script>
