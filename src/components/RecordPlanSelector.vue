<template>
  <div class="record-plan-selector">
    <span class="record-plan-tip">录像计划配置云端录像开启时段</span>

    <div class="plan-actions">
      <ElButton size="small" @click="reset">
        <ElIcon><Refresh /></ElIcon>
        重置
      </ElButton>
      <ElButton size="small" @click="selectAll">
        <ElIcon><Select /></ElIcon>
        全选
      </ElButton>
      <ElButton size="small" @click="unselectAll">
        <ElIcon><CloseBold /></ElIcon>
        清空
      </ElButton>
    </div>

    <div class="plan-days">
      <div
        v-for="(day, index) in days"
        :key="index"
        class="plan-day-row"
      >
        <div class="plan-day-label">星期{{ day }}</div>
        <div class="plan-day-content">
          <div class="plan-scale">
            <div v-for="hour in 12" :key="hour" class="scale-hour">{{ hour * 2 }}:00</div>
          </div>
          <div
            class="plan-time-area"
            @mousedown="handleMouseDown($event, index)"
            @mousemove="handleMouseMove($event, index)"
            @mouseup="handleMouseUp"
          >
            <div
              v-for="(range, rangeIndex) in (durations[index] || [])"
              :key="rangeIndex"
              class="plan-time-range"
              :style="getRangeStyle(index, rangeIndex)"
              @click.stop="handleRangeClick(index, rangeIndex)"
            >
              <ElPopover
                placement="top"
                :width="240"
                trigger="click"
              >
                <template #reference>
                  <div class="range-bar"></div>
                </template>
                <template #default>
                  <div class="range-editor">
                    <ElTimePicker
                      v-model="range.start_time"
                      format="HH:mm"
                      value-format="HH:mm"
                      placeholder="开始时间"
                      size="small"
                      style="width: 110px;"
                    />
                    <span style="margin: 0 4px;">-</span>
                    <ElTimePicker
                      v-model="range.end_time"
                      format="HH:mm"
                      value-format="HH:mm"
                      placeholder="结束时间"
                      size="small"
                      style="width: 110px;"
                    />
                    <div style="text-align: center; margin-top: 8px;">
                      <ElButton size="small" type="danger" @click="removeRange(index, rangeIndex)">删除</ElButton>
                    </div>
                  </div>
                </template>
              </ElPopover>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Select, CloseBold } from '@element-plus/icons-vue'
import type { RecordPlanRange } from '@/types/record-plan'

interface Props {
  modelValue: RecordPlanRange[] | null
}

interface Emits {
  (e: 'update:modelValue', value: RecordPlanRange[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const days = ['一', '二', '三', '四', '五', '六', '日']

// 时间范围数据，7天，每天多个时间段
const durations = ref<RecordPlanRange[][]>([[], [], [], [], [], [], []])
const originalDurations = ref<RecordPlanRange[][]>([[], [], [], [], [], [], []])

// 拖拽状态
const isDragging = ref(false)
const dragDayIndex = ref(-1)
const dragStartTime = ref('')
const dragCurrentX = ref(0)

// 初始化数据
const init = (data: string | RecordPlanRange[] | null = null) => {
  durations.value = [[], [], [], [], [], [], []]
  originalDurations.value = [[], [], [], [], [], [], []]

  if (data) {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (Array.isArray(parsed) && parsed.length === 7) {
      durations.value = [...parsed]
      originalDurations.value = [...parsed]
    }
  }
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      init(JSON.stringify(val))
    } else {
      init()
    }
  },
  { immediate: true }
)

// 获取时间段样式
const getRangeStyle = (dayIndex: number, rangeIndex: number) => {
  const range = durations.value[dayIndex]?.[rangeIndex]
  if (!range) return {}

  const dayKey = dayIndex + 1
  const startTime = range[`s${dayKey}` as keyof RecordPlanRange] as string || '00:00'
  const endTime = range[`e${dayKey}` as keyof RecordPlanRange] as string || '00:00'

  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  const totalMinutes = 24 * 60 // 1440分钟
  const leftPercent = (startMinutes / totalMinutes) * 100
  const widthPercent = ((endMinutes - startMinutes) / totalMinutes) * 100

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`
  }
}

// 时间转分钟
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 分钟转时间
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 鼠标按下开始拖拽
const handleMouseDown = (e: MouseEvent, dayIndex: number) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left

  // 对齐到30分钟
  const totalMinutes = (x / rect.width) * 1440
  const alignedMinutes = Math.round(totalMinutes / 30) * 30

  dragDayIndex.value = dayIndex
  dragStartTime.value = minutesToTime(alignedMinutes)
  dragCurrentX.value = x
  isDragging.value = true

  // 创建新时间段
  const newRange: RecordPlanRange = {}
  const dayKey = dayIndex + 1
  ;(newRange[`s${dayKey}` as keyof RecordPlanRange] as any) = dragStartTime.value
  ;(newRange[`e${dayKey}` as keyof RecordPlanRange] as any) = dragStartTime.value

  // 插入到正确位置
  const dayRanges = durations.value[dayIndex] || []
  let inserted = false
  for (let i = 0; i < dayRanges.length; i++) {
    if (timeToMinutes((dayRanges[i][`s${dayKey}` as keyof RecordPlanRange] as string) || '00:00') > alignedMinutes) {
      dayRanges.splice(i, 0, newRange)
      inserted = true
      break
    }
  }
  if (!inserted) {
    dayRanges.push(newRange)
  }
  durations.value[dayIndex] = dayRanges
}

// 鼠标移动
const handleMouseMove = (e: MouseEvent, dayIndex: number) => {
  if (!isDragging.value || dragDayIndex.value !== dayIndex) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))

  const totalMinutes = (x / rect.width) * 1440
  const alignedMinutes = Math.round(totalMinutes / 30) * 30

  const dayKey = dayIndex + 1
  const dayRanges = durations.value[dayIndex]
  if (dayRanges && dayRanges.length > 0) {
    const lastRange = dayRanges[dayRanges.length - 1]
    const startMinutes = timeToMinutes((lastRange[`s${dayKey}` as keyof RecordPlanRange] as string) || '00:00')

    if (alignedMinutes > startMinutes) {
      ;(lastRange[`e${dayKey}` as keyof RecordPlanRange] as any) = minutesToTime(alignedMinutes)
    }
  }
}

// 鼠标抬起
const handleMouseUp = () => {
  if (isDragging.value) {
    mergeAndValidate()
    isDragging.value = false
    dragDayIndex.value = -1
  }
}

// 合并相邻时间段并验证
const mergeAndValidate = () => {
  for (let i = 0; i < 7; i++) {
    const dayKey = i + 1
    let ranges = durations.value[i] || []

    // 按开始时间排序
    ranges.sort((a, b) => {
      const aStart = timeToMinutes((a[`s${dayKey}` as keyof RecordPlanRange] as string) || '00:00')
      const bStart = timeToMinutes((b[`s${dayKey}` as keyof RecordPlanRange] as string) || '00:00')
      return aStart - bStart
    })

    // 移除无效的时间段（开始时间 >= 结束时间）
    ranges = ranges.filter(r => {
      const start = timeToMinutes((r[`s${dayKey}` as keyof RecordPlanRange] as string) || '00:00')
      const end = timeToMinutes((r[`e${dayKey}` as keyof RecordPlanRange] as string) || '00:00')
      return start < end
    })

    // 合并相邻或重叠的时间段
    for (let j = ranges.length - 1; j > 0; j--) {
      const prev = ranges[j - 1]
      const curr = ranges[j]
      const prevEnd = timeToMinutes((prev[`e${dayKey}` as keyof RecordPlanRange] as string) || '00:00')
      const currStart = timeToMinutes((curr[`s${dayKey}` as keyof RecordPlanRange] as string) || '00:00')

      if (currStart <= prevEnd) {
        // 合并
        ;(prev[`e${dayKey}` as keyof RecordPlanRange] as any) = curr[`e${dayKey}` as keyof RecordPlanRange] as string || '00:00'
        ranges.splice(j, 1)
      }
    }

    durations.value[i] = ranges
  }

  emitChanges()
}

// 点击时间段编辑
const handleRangeClick = (dayIndex: number, rangeIndex: number) => {
  // 弹出Popover由ElPopover处理
}

// 删除时间段
const removeRange = (dayIndex: number, rangeIndex: number) => {
  const ranges = durations.value[dayIndex] || []
  ranges.splice(rangeIndex, 1)
  durations.value[dayIndex] = [...ranges]
  emitChanges()
}

// 重置
const reset = () => {
  durations.value = originalDurations.value.map(d => [...d])
  emitChanges()
}

// 全选
const selectAll = () => {
  for (let i = 0; i < 7; i++) {
    const dayKey = i + 1
    const range: RecordPlanRange = {}
    ;(range[`s${dayKey}` as keyof RecordPlanRange] as any) = '00:00'
    ;(range[`e${dayKey}` as keyof RecordPlanRange] as any) = '24:00'
    durations.value[i] = [range]
  }
  emitChanges()
}

// 清空
const unselectAll = () => {
  durations.value = [[], [], [], [], [], [], []]
  emitChanges()
}

// 触发变更事件
const emitChanges = () => {
  emit('update:modelValue', durations.value as RecordPlanRange[])
}

// 暴露初始化方法
const initPlan = (data: string | RecordPlanRange[] | null = null) => {
  init(data)
}

// 暴露获取计划方法
const getPlan = (): RecordPlanRange[] => {
  mergeAndValidate()
  return durations.value as RecordPlanRange[]
}

// 暴露是否修改方法
const isModify = (): boolean => {
  return JSON.stringify(durations.value) !== JSON.stringify(originalDurations.value)
}

defineExpose({
  initPlan,
  getPlan,
  isModify
})

// 全局鼠标事件
onMounted(() => {
  document.addEventListener('mouseup', handleMouseUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped lang="scss">
.record-plan-selector {
  width: 100%;
  overflow-x: auto;

  .record-plan-tip {
    display: block;
    color: var(--text-muted);
    font-style: italic;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .plan-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .plan-days {
    background: #f7f7f7;
    padding: 15px;
    border-radius: 4px;
  }

  .plan-day-row {
    display: flex;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .plan-day-label {
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 14px;
    background: #f7f7f7;
  }

  .plan-day-content {
    flex: 1;
    background: white;
    border: 1px solid #ddd;
  }

  .plan-scale {
    display: flex;
    height: 24px;
    border-bottom: 1px solid #eee;

    .scale-hour {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--text-muted);
      border-right: 1px solid #eee;

      &:first-child {
        border-left: none;
      }
    }
  }

  .plan-time-area {
    position: relative;
    height: 50px;
    cursor: crosshair;
  }

  .plan-time-range {
    position: absolute;
    top: 0;
    height: 100%;
    background: var(--el-color-primary);
    opacity: 0.8;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }

    .range-bar {
      width: 100%;
      height: 100%;
    }
  }

  .range-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
