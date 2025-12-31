<template>
  <div class="p-6">
    <t-card title="调试工具" :bordered="true">
      <div class="flex flex-col gap-4">
        <p class="text-gray-500">此页面仅在开发环境可见，用于快速测试和数据初始化。</p>
        
        <div class="flex items-center gap-4">
          <t-button theme="primary" :loading="loading" @click="handleLoadExampleData">
            加载示例数据
          </t-button>
          <span class="text-sm text-gray-400">注意：这将清空现有数据（保留 system 账号）并加载预设的示例数据。</span>
        </div>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next'

// 仅开发环境可用
if (!import.meta.env.DEV) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const loading = ref(false)

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
    console.error('Failed to load example data:', error)
    MessagePlugin.error(error.statusMessage || '加载失败')
  } finally {
    loading.value = false
  }
}
</script>
