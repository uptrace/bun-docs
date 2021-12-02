<template>
  <div style="padding-bottom: 8px">Get insights and updates in your inbox:</div>

  <el-form ref="formRef" :model="form.data" :rules="form.rules" inline>
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
      <el-button v-if="!form.done" type="primary" :loading="form.loading" @click="form.submit">
        Subscribe
      </el-button>
      <el-button v-else type="success" :loading="form.loading" @click="form.submit">
        <el-icon class="el-icon--left"><Check /></el-icon>
        Subscribed
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import axios from 'axios'
import { Check } from '@element-plus/icons'
import { ref, reactive, proxyRefs, Ref } from 'vue'

export default {
  components: { Check },

  setup() {
    const formRef = ref()

    return { formRef, form: useForm(formRef) }
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
      .post('https://api.uptrace.dev/api/v1/go-newsletter/subscription', {
        email: data.email,
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
