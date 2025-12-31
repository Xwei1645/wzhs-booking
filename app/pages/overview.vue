<template>
  <div class="overview-page">
    <!-- 筛选卡片 -->
    <t-card :bordered="false" class="filter-card">
      <div class="filter-row">
        <t-space align="center" :size="12">
          <span class="filter-label">日期范围</span>
          <t-date-range-picker
            v-model="dateRange"
            mode="date"
            allow-input
            clearable
            style="width: 260px"
          />
        </t-space>

        <t-button variant="outline" shape="square" @click="isSwapped = !isSwapped" title="交换行列">
          <template #icon><swap-icon /></template>
        </t-button>

        <t-space align="center" :size="12">
          <span class="filter-label">场地</span>
          <t-select
            v-model="selectedRoomIds"
            multiple
            placeholder="选择场地"
            :options="roomOptions"
            :min-collapsed-num="1"
            style="width: 260px"
          />
        </t-space>

        <!-- 图例 -->
        <div class="legend">
          <div class="legend-item">
            <span class="legend-dot approved"></span>
            <span>已通过</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot pending"></span>
            <span>待审批</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot rejected"></span>
            <span>已拒绝/取消</span>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 表格区域（不在卡片内） -->
    <div class="table-wrapper">
      <table class="schedule-table">
        <thead>
          <tr v-if="!isSwapped">
            <th class="corner-cell">
              <div class="corner-content">
                <span class="corner-top">场地</span>
                <span class="corner-line"></span>
                <span class="corner-bottom">日期</span>
              </div>
            </th>
            <th v-for="room in displayedRooms" :key="room.id">
              {{ room.name }}
            </th>
          </tr>
          <tr v-else>
            <th class="corner-cell">
              <div class="corner-content">
                <span class="corner-top">日期</span>
                <span class="corner-line"></span>
                <span class="corner-bottom">场地</span>
              </div>
            </th>
            <th v-for="day in weekDays" :key="day.dateStr">
              <div class="th-date">{{ day.dateStr }}</div>
              <div class="th-weekday">{{ day.weekday }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="!isSwapped">
            <tr v-for="day in weekDays" :key="day.dateStr">
              <td class="row-header">
                <div class="row-date">{{ day.dateStr }}</div>
                <div class="row-weekday">{{ day.weekday }}</div>
              </td>
              <td v-for="room in displayedRooms" :key="room.id" class="booking-cell">
                <div class="booking-list">
                  <div
                    v-for="booking in getBookingsForCell(room.id, day.fullDate)"
                    :key="booking.id"
                    class="booking-item"
                    :class="booking.status"
                    :title="`${booking.startTimeStr} - ${booking.endTimeStr}\n${booking.purpose}\n${booking.userName}`"
                  >
                    <div class="booking-time">{{ booking.startTimeStr }} - {{ booking.endTimeStr }}</div>
                    <div class="booking-purpose">{{ booking.purpose }}</div>
                    <div class="booking-user">{{ booking.userName }}</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="room in displayedRooms" :key="room.id">
              <td class="row-header">{{ room.name }}</td>
              <td v-for="day in weekDays" :key="day.dateStr" class="booking-cell">
                <div class="booking-list">
                  <div
                    v-for="booking in getBookingsForCell(room.id, day.fullDate)"
                    :key="booking.id"
                    class="booking-item"
                    :class="booking.status"
                    :title="`${booking.startTimeStr} - ${booking.endTimeStr}\n${booking.purpose}\n${booking.userName}`"
                  >
                    <div class="booking-time">{{ booking.startTimeStr }} - {{ booking.endTimeStr }}</div>
                    <div class="booking-purpose">{{ booking.purpose }}</div>
                    <div class="booking-user">{{ booking.userName }}</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isoWeek from 'dayjs/plugin/isoWeek'
import { SwapIcon } from 'tdesign-icons-vue-next'

dayjs.extend(isoWeek)
dayjs.locale('zh-cn')

useHead({ title: '预约总览' })

// --- State ---
const dateRange = ref([
  dayjs().startOf('isoWeek').format('YYYY-MM-DD'),
  dayjs().endOf('isoWeek').format('YYYY-MM-DD')
])
const selectedRoomIds = ref<number[]>([])
const isSwapped = ref(false)

// --- Data Fetching ---
const { data: rooms } = await useFetch('/api/rooms')
const { data: bookings } = await useFetch('/api/bookings', { query: { scope: 'all' } })

// --- Computed ---
const roomOptions = computed(() => rooms.value?.map(r => ({ label: r.name, value: r.id })) || [])

watchEffect(() => {
  if (rooms.value?.length && !selectedRoomIds.value.length) {
    selectedRoomIds.value = rooms.value.map(r => r.id)
  }
})

const displayedRooms = computed(() => rooms.value?.filter(r => selectedRoomIds.value.includes(r.id)) || [])

const weekDays = computed(() => {
  if (!dateRange.value || dateRange.value.length !== 2) return []
  const start = dayjs(dateRange.value[0])
  const end = dayjs(dateRange.value[1])
  const days = []
  let current = start
  let count = 0
  while ((current.isBefore(end) || current.isSame(end, 'day')) && count < 31) {
    days.push({
      weekday: current.format('dddd'),
      dateStr: current.format('MM-DD'),
      fullDate: current.format('YYYY-MM-DD')
    })
    current = current.add(1, 'day')
    count++
  }
  return days
})

const getBookingsForCell = (roomId: number, dateStr: string) => {
  if (!bookings.value) return []
  return bookings.value
    .filter(b => b.roomId === roomId && dayjs(b.startTime).format('YYYY-MM-DD') === dateStr)
    .map(b => ({
      ...b,
      startTimeStr: dayjs(b.startTime).format('HH:mm'),
      endTimeStr: dayjs(b.endTime).format('HH:mm')
    }))
    .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf())
}
</script>

<style scoped>
.overview-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  /* 关键：限制宽度为父容器宽度，不被内容撑开 */
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

/* 筛选卡片 */
.filter-card {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: var(--td-text-color-primary);
  white-space: nowrap;
}

/* 图例 */
.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-dot.approved {
  background-color: var(--td-success-color);
}

.legend-dot.pending {
  background-color: var(--td-warning-color);
}

.legend-dot.rejected {
  background-color: var(--td-error-color);
}

/* 表格容器 - 关键修复 */
.table-wrapper {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background-color: var(--td-bg-color-container);
}

/* 表格 */
.schedule-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.schedule-table th,
.schedule-table td {
  border-right: 1px solid var(--td-component-border);
  border-bottom: 1px solid var(--td-component-border);
  padding: 10px 16px;
  text-align: center;
  background-color: var(--td-bg-color-container);
  white-space: nowrap;
}

.schedule-table th {
  background-color: var(--td-bg-color-secondarycontainer);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 20;
}

/* 首列固定 */
.schedule-table th:first-child,
.schedule-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 21;
  background-color: var(--td-bg-color-secondarycontainer);
}

.schedule-table th:first-child {
  z-index: 30;
}

/* 斜线表头 */
.corner-cell {
  width: 100px;
  height: 60px;
  padding: 0 !important;
}

.corner-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to top right,
    transparent calc(50% - 0.5px),
    var(--td-component-border) calc(50% - 0.5px),
    var(--td-component-border) calc(50% + 0.5px),
    transparent calc(50% + 0.5px)
  );
}

.corner-top {
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 12px;
}

.corner-bottom {
  position: absolute;
  bottom: 6px;
  left: 10px;
  font-size: 12px;
}

/* 表头日期 */
.th-date {
  font-weight: 600;
  font-size: 14px;
}

.th-weekday {
  font-weight: 400;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

/* 行标题 */
.row-header {
  font-weight: 600;
}

.row-date {
  font-size: 14px;
}

.row-weekday {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

/* 预约单元格 */
.booking-cell {
  vertical-align: top;
  min-width: 140px;
  text-align: left;
  background-color: var(--td-bg-color-container) !important;
}

.booking-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.booking-item {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  border-left: 3px solid transparent;
  background-color: var(--td-bg-color-secondarycontainer);
  transition: transform 0.15s, box-shadow 0.15s;
}

.booking-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 状态颜色 */
.booking-item.approved {
  background-color: var(--td-success-color-1);
  border-left-color: var(--td-success-color);
  color: var(--td-success-color-8);
}

.booking-item.pending {
  background-color: var(--td-warning-color-1);
  border-left-color: var(--td-warning-color);
  color: var(--td-warning-color-8);
}

.booking-item.rejected,
.booking-item.cancelled {
  background-color: var(--td-error-color-1);
  border-left-color: var(--td-error-color);
  color: var(--td-error-color-8);
  opacity: 0.7;
}

.booking-time {
  font-weight: 600;
  margin-bottom: 2px;
}

.booking-purpose {
  margin-bottom: 2px;
  word-break: break-word;
  white-space: normal;
}

.booking-user {
  font-size: 11px;
  opacity: 0.8;
}
</style>
