<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <h2 class="page-title">调试</h2>
      <t-button variant="outline" @click="handleHide">隐藏调试页面</t-button>
    </div>
    <t-card :bordered="false" class="content-card">
      <div class="debug-content">
        <t-button theme="primary" :loading="loading" @click="handleConfirmLoad">
          加载示例数据
        </t-button>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
useHead({ title: '调试' })

const showDebug = useState('showDebug', () => false)

// 允许开发环境或超级管理员访问
if (import.meta.client) {
  try {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    if (!import.meta.env.DEV && user?.role !== 'super_admin' && localStorage.getItem('showDebugMenu') !== 'true') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page Not Found',
        fatal: true
      })
    }
  } catch (e) {
    if (!import.meta.env.DEV) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page Not Found',
        fatal: true
      })
    }
  }
}

const handleHide = () => {
  showDebug.value = false
  localStorage.setItem('showDebugMenu', 'false')
  MessagePlugin.info('调试页面已隐藏')
  navigateTo('/about')
}

const loading = ref(false)

const handleConfirmLoad = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '确认加载示例数据？',
    body: '这将清空现有数据（保留 system 账号）并加载预设的示例数据。此操作不可逆。',
    onConfirm: async () => {
      confirmDialog.hide()
      await handleLoadExampleData()
    },
  })
}

const handleLoadExampleData = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/debug/seed', {
      method: 'POST'
    })
    if (response.success) {
      MessagePlugin.success(`示例数据加载成功: ${response.details.users}个用户, ${response.details.orgs}个组织, ${response.details.rooms}个场地, ${response.details.bookings}条预约`)
    }
  } catch (error: any) {
    MessagePlugin.error('加载失败: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.debug-content {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
</style>
