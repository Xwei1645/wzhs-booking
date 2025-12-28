<template>
  <div class="page-container">
    <t-card title="预约审批" :bordered="false" class="content-card">
      <template #actions>
        <div class="header-actions">
          <t-radio-group v-model="statusFilter" variant="default-filled">
            <t-radio-button value="all">全部</t-radio-button>
            <t-radio-button value="pending">待审批</t-radio-button>
            <t-radio-button value="confirmed">已通过</t-radio-button>
            <t-radio-button value="rejected">已驳回</t-radio-button>
            <t-radio-button value="cancelled">已取消</t-radio-button>
          </t-radio-group>
        </div>
      </template>

      <t-table
        row-key="id"
        :data="filteredBookings"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #time="{ row }">
          <div class="time-cell">
            <span>{{ formatDateTime(row.startTime) }}</span>
            <span class="time-separator">至</span>
            <span>{{ formatDateTime(row.endTime) }}</span>
          </div>
        </template>
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ getStatusLabel(row.status) }}
          </t-tag>
        </template>
        <template #operation="{ row }">
          <t-space v-if="row.status === 'pending'">
            <t-link theme="primary" hover="color" @click="handleApprove(row)">通过</t-link>
            <t-link theme="danger" hover="color" @click="handleReject(row)">驳回</t-link>
          </t-space>
          <t-link v-else-if="row.remark" theme="default" @click="showRemark(row)">查看备注</t-link>
          <span v-else>-</span>
        </template>
      </t-table>
    </t-card>

    <!-- 自动审批规则卡片 -->
    <t-card title="自动审批规则" :bordered="false" class="content-card">
      <template #actions>
        <t-button theme="primary" variant="outline" @click="handleAddRule">
          <template #icon><add-icon /></template>
          新增规则
        </t-button>
      </template>
      
      <t-table
        row-key="id"
        :data="rules"
        :columns="ruleColumns"
        :loading="rulesLoading"
      >
        <template #conditions="{ row }">
          <div class="rule-conditions">
            <t-tag v-if="row.organizationName" variant="outline" size="small">组织: {{ row.organizationName }}</t-tag>
            <t-tag v-if="row.roomName" variant="outline" size="small">场地: {{ row.roomName }}</t-tag>
            <t-tag v-if="row.userName" variant="outline" size="small">用户: {{ row.userName }}</t-tag>
            <t-tag v-if="row.maxDuration" variant="outline" size="small">时长 ≤ {{ row.maxDuration }}min</t-tag>
            <t-tag v-if="row.startHour || row.endHour" variant="outline" size="small">
              时间: {{ row.startHour || '00:00' }} - {{ row.endHour || '23:59' }}
            </t-tag>
            <span v-if="!row.organizationName && !row.roomName && !row.userName && !row.maxDuration && !row.startHour && !row.endHour" style="color: var(--td-text-color-placeholder)">无限制</span>
          </div>
        </template>
        <template #action="{ row }">
          <t-tag :theme="row.action === 'approve' ? 'success' : 'danger'" variant="light">
            {{ row.action === 'approve' ? '通过' : '驳回' }}
          </t-tag>
        </template>
        <template #status="{ row }">
          <t-switch v-model="row.status" @change="(val) => handleRuleStatusChange(row, val)" />
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-popconfirm content="确认删除该规则吗？" @confirm="handleDeleteRule(row)">
              <t-link theme="danger" hover="color">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 驳回原因对话框 -->
    <t-dialog
      v-model:visible="rejectVisible"
      header="驳回预约"
      :confirm-btn="{ content: '确认驳回', theme: 'danger', loading: submitLoading }"
      @confirm="confirmReject"
    >
      <div style="padding: 12px 0">
        <t-textarea v-model="rejectRemark" placeholder="请输入驳回原因（可选）" :autosize="{ minRows: 3 }" />
      </div>
    </t-dialog>

    <!-- 查看备注对话框 -->
    <t-dialog
      v-model:visible="remarkVisible"
      header="预约备注/驳回原因"
      :footer="false"
    >
      <div style="padding: 12px 0">
        <p style="white-space: pre-wrap; color: var(--td-text-color-primary)">{{ currentRemark }}</p>
      </div>
    </t-dialog>

    <!-- 新增规则对话框 -->
    <t-dialog
      v-model:visible="ruleDialogVisible"
      header="新增自动审批规则"
      :confirm-btn="{ content: '提交', loading: ruleSubmitLoading }"
      @confirm="handleRuleSubmit"
      width="600px"
    >
      <t-form ref="ruleFormRef" :data="ruleFormData" :rules="ruleFormRules" label-align="top">
        <t-form-item label="规则名称" name="name">
          <t-input v-model="ruleFormData.name" placeholder="例如：学生会预约自动通过" />
        </t-form-item>
        
        <div class="form-grid">
          <t-form-item label="限定组织" name="organizationId">
            <t-select v-model="ruleFormData.organizationId" :options="orgOptions" clearable filterable placeholder="不限" />
          </t-form-item>
          <t-form-item label="限定场地" name="roomId">
            <t-select v-model="ruleFormData.roomId" :options="roomOptions" clearable filterable placeholder="不限" />
          </t-form-item>
          <t-form-item label="限定用户" name="userId">
            <t-select v-model="ruleFormData.userId" :options="userOptions" clearable filterable placeholder="不限" />
          </t-form-item>
          <t-form-item label="最大时长 (分钟)" name="maxDuration">
            <t-input-number v-model="ruleFormData.maxDuration" :min="1" placeholder="不限" style="width: 100%" />
          </t-form-item>
        </div>

        <div class="form-grid">
          <t-form-item label="开始时间范围" name="startHour">
            <t-time-picker v-model="ruleFormData.startHour" format="HH:mm" placeholder="开始" style="width: 100%" />
          </t-form-item>
          <t-form-item label="结束时间范围" name="endHour">
            <t-time-picker v-model="ruleFormData.endHour" format="HH:mm" placeholder="结束" style="width: 100%" />
          </t-form-item>
        </div>

        <t-form-item label="执行动作" name="action">
          <t-radio-group v-model="ruleFormData.action">
            <t-radio value="approve">自动通过</t-radio>
            <t-radio value="reject">自动驳回</t-radio>
          </t-radio-group>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { MessagePlugin, type PrimaryTableCol } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'

const loading = ref(false)
const bookings = ref<any[]>([])
const statusFilter = ref('pending')
const submitLoading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const fetchBookings = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/bookings')
    bookings.value = data as any[]
    pagination.total = bookings.value.length
  } catch (error: any) {
    MessagePlugin.error('获取预约列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const filteredBookings = computed(() => {
  let result = bookings.value
  if (statusFilter.value !== 'all') {
    result = result.filter(b => b.status === statusFilter.value)
  }
  return result
})

const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 70 },
  { colKey: 'roomName', title: '场地名称', width: 150 },
  { colKey: 'orgName', title: '组织', width: 150 },
  { colKey: 'userName', title: '申请人', width: 120 },
  { colKey: 'time', title: '预约时间', width: 200 },
  { colKey: 'purpose', title: '用途', ellipsis: true },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'operation', title: '操作', width: 150, fixed: 'right' },
]

const onPageChange = (pageInfo: any) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
}

const getStatusTheme = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'confirmed': return 'success'
    case 'rejected': return 'danger'
    case 'cancelled': return 'default'
    default: return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '待审批'
    case 'confirmed': return '已通过'
    case 'rejected': return '已驳回'
    case 'cancelled': return '已取消'
    default: return status
  }
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const handleApprove = async (row: any) => {
  try {
    await $fetch<any>('/api/bookings/update', {
      method: 'POST',
      body: { id: row.id, status: 'confirmed' }
    })
    MessagePlugin.success('已通过预约')
    fetchBookings()
  } catch (error: any) {
    MessagePlugin.error('操作失败：' + error.message)
  }
}

const rejectVisible = ref(false)
const rejectRemark = ref('')
const currentBooking = ref<any>(null)

const handleReject = (row: any) => {
  currentBooking.value = row
  rejectRemark.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!currentBooking.value) return
  submitLoading.value = true
  try {
    await $fetch<any>('/api/bookings/update', {
      method: 'POST',
      body: { 
        id: currentBooking.value.id, 
        status: 'rejected',
        remark: rejectRemark.value 
      }
    })
    MessagePlugin.success('已驳回预约')
    rejectVisible.value = false
    fetchBookings()
  } catch (error: any) {
    MessagePlugin.error('操作失败：' + error.message)
  } finally {
    submitLoading.value = false
  }
}

const remarkVisible = ref(false)
const currentRemark = ref('')
const showRemark = (row: any) => {
  currentRemark.value = row.remark
  remarkVisible.value = true
}

// 自动审批规则逻辑
const rules = ref<any[]>([])
const rulesLoading = ref(false)
const ruleDialogVisible = ref(false)
const ruleSubmitLoading = ref(false)
const ruleFormRef = ref<any>(null)

const ruleFormData = reactive({
  name: '',
  organizationId: undefined as number | undefined,
  roomId: undefined as number | undefined,
  userId: undefined as number | undefined,
  maxDuration: undefined as number | undefined,
  startHour: '',
  endHour: '',
  action: 'approve'
})

const ruleFormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' as const }],
  action: [{ required: true, message: '请选择执行动作', trigger: 'change' as const }]
}

const ruleColumns: PrimaryTableCol[] = [
  { colKey: 'name', title: '规则名称' },
  { colKey: 'conditions', title: '触发条件', width: 300 },
  { colKey: 'action', title: '执行动作', width: 100 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'operation', title: '操作', width: 100, fixed: 'right' }
]

const fetchRules = async () => {
  rulesLoading.value = true
  try {
    rules.value = await $fetch<any>('/api/auto-approval')
  } catch (error: any) {
    MessagePlugin.error('获取规则失败：' + error.message)
  } finally {
    rulesLoading.value = false
  }
}

const orgOptions = ref<any[]>([])
const userOptions = ref<any[]>([])
const roomOptions = ref<any[]>([])

const fetchOptions = async () => {
  try {
    const [orgs, users, rooms] = await Promise.all([
      $fetch<any>('/api/organizations'),
      $fetch<any>('/api/users'),
      $fetch<any>('/api/rooms')
    ])
    orgOptions.value = orgs.map((i: any) => ({ label: i.name, value: i.id }))
    userOptions.value = users.map((i: any) => ({ label: `${i.name} (${i.account})`, value: i.id }))
    roomOptions.value = rooms.map((i: any) => ({ label: i.name, value: i.id }))
  } catch (error) {
    console.error('Failed to fetch options', error)
  }
}

const handleAddRule = () => {
  Object.assign(ruleFormData, {
    name: '',
    organizationId: undefined,
    roomId: undefined,
    userId: undefined,
    maxDuration: undefined,
    startHour: '',
    endHour: '',
    action: 'approve'
  })
  fetchOptions()
  ruleDialogVisible.value = true
}

const handleRuleSubmit = async () => {
  const validateResult = await ruleFormRef.value?.validate()
  if (validateResult !== true) return

  ruleSubmitLoading.value = true
  try {
    await $fetch<any>('/api/auto-approval/create', {
      method: 'POST',
      body: ruleFormData
    })
    MessagePlugin.success('规则创建成功')
    ruleDialogVisible.value = false
    fetchRules()
  } catch (error: any) {
    MessagePlugin.error('创建失败：' + error.message)
  } finally {
    ruleSubmitLoading.value = false
  }
}

const handleRuleStatusChange = async (row: any, val: any) => {
  try {
    await $fetch<any>('/api/auto-approval/update', {
      method: 'POST',
      body: { id: row.id, status: val }
    })
    MessagePlugin.success('状态更新成功')
  } catch (error: any) {
    MessagePlugin.error('更新失败：' + error.message)
    row.status = !val // 回滚
  }
}

const handleDeleteRule = async (row: any) => {
  try {
    await $fetch<any>('/api/auto-approval/delete', {
      method: 'POST',
      body: { id: row.id }
    })
    MessagePlugin.success('删除成功')
    fetchRules()
  } catch (error: any) {
    MessagePlugin.error('删除失败：' + error.message)
  }
}

onMounted(() => {
  fetchBookings()
  fetchRules()
})
</script>

<style scoped>
.content-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.header-actions {
  display: flex;
  gap: 16px;
}
.time-cell {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  line-height: 1.4;
}
.time-separator {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  margin: 2px 0;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.rule-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
