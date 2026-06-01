<template>
  <div class="record-plan-selector">
    <span class="record-plan-tip">录像计划配置云端录像开启时段</span>

    <div class="plan-actions">
      <ElButton size="small" @click="reset">
        <ElIcon><Refresh /></ElIcon>
        重置
      </ElButton>
      <ElButton size="small" @click="selectAll">全选</ElButton>
      <ElButton size="small" @click="unselectAll">清空</ElButton>
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
            <!-- 大刻度：每 2 小时一个标签 (0:00 ~ 24:00) -->
            <div
              v-for="h in 13"
              :key="'major-' + h"
              :class="['scale-major', h === 1 ? 'scale-major--first' : (h === 13 ? 'scale-major--last' : '')]"
              :style="{ left: `${(h - 1) * 2 / 24 * 100}%` }"
            >{{ String((h - 1) * 2).padStart(2, '0') }}:00</div>
            <!-- 小刻度：每 1 小时一个（奇数小时） -->
            <div
              v-for="h in 23"
              :key="'minor-' + h"
              class="scale-minor"
              :style="{ left: `${h / 24 * 100}%` }"
            ></div>
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
              :style="getRangeStyle(range)"
              @click.stop
            >
              <ElPopover
                placement="top"
                :width="280"
                trigger="click"
                :teleported="true"
              >
                <template #reference>
                  <div class="range-bar"></div>
                </template>
                <template #default>
                  <div class="range-editor">
                    <div class="range-editor-times">
                      <ElTimePicker
                        v-model="range.start_time"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="开始时间"
                        size="small"
                        style="width: 115px;"
                        @change="onTimeChange(index)"
                      />
                      <span class="range-sep">-</span>
                      <ElTimePicker
                        v-model="range.end_time"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="结束时间"
                        size="small"
                        style="width: 115px;"
                        @change="onTimeChange(index)"
                      />
                    </div>
                    <div class="range-editor-actions">
                      <ElButton size="small" type="danger" @click="removeRange(index, rangeIndex)">删除</ElButton>
                    </div>
                  </div>
                </template>
              </ElPopover>
            </div>
          </div>
        </div>

        <!-- 复制到其他天 -->
        <div class="plan-day-copy">
          <ElPopover
            v-model:visible="copyPopoverVisible[index]"
            placement="right"
            :width="180"
            trigger="click"
          >
            <template #reference>
              <ElButton size="small" link type="primary">
                复制到其他天
              </ElButton>
            </template>
            <template #default>
              <div class="copy-popover">
                <div class="copy-title">复制到：</div>
                <ElCheckboxGroup v-model="copyTargets[index]" class="copy-checkboxes">
                  <ElCheckbox
                    v-for="(d, di) in days"
                    :key="di"
                    :value="di"
                    :disabled="di === index"
                  >星期{{ d }}</ElCheckbox>
                </ElCheckboxGroup>
                <div class="copy-actions">
                  <ElButton size="small" @click="closeCopyPopover(index)">取消</ElButton>
                  <ElButton size="small" type="primary" @click="copyToTargets(index)">确定</ElButton>
                </div>
              </div>
            </template>
          </ElPopover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/** 与后端对接的时间段格式，week_day 使用 '1'~'7'（兼容 PHP date('N') 和 MON/TUE 等串行转换） */
export interface SelectorRange {
  week_day: string
  start_time: string
  end_time: string
}

interface Props {
  modelValue: SelectorRange[] | null
}

interface Emits {
  (e: 'update:modelValue', value: SelectorRange[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 内部时间段类型（与后端字段一一对应）
interface TimeRange {
  week_day: string   // PHP date('N'): '1'~'7'
  start_time: string
  end_time: string
}

const days = ['一', '二', '三', '四', '五', '六', '日']

// 7天时间段，durations[i] 对应 week_day = String(i+1)
const durations = ref<TimeRange[][]>([[], [], [], [], [], [], []])
const originalDurations = ref<TimeRange[][]>([[], [], [], [], [], [], []])

// 拖拽状态
const isDragging = ref(false)
const dragDayIndex = ref(-1)
const dragStartMinutes = ref(0)

// 复制功能：每行独立的目标选择
const copyTargets = ref<number[][]>(Array.from({ length: 7 }, () => []))
const copyPopoverVisible = ref<boolean[]>(Array(7).fill(false))

const closeCopyPopover = (index: number) => {
  copyPopoverVisible.value[index] = false
}

// ─── 工具函数 ───────────────────────────────────────────────

const timeToMinutes = (time: string): number => {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

const minutesToTime = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(1440, minutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─── 初始化 ─────────────────────────────────────────────────

const init = (data: SelectorRange[] | null = null) => {
  const empty: TimeRange[][] = [[], [], [], [], [], [], []]
  if (data && Array.isArray(data)) {
    data.forEach((r) => {
      const idx = Number(r.week_day) - 1   // week_day '1'~'7' → index 0~6
      if (idx >= 0 && idx < 7) {
        empty[idx].push({
          week_day: r.week_day,
          start_time: r.start_time,
          end_time: r.end_time
        })
      }
    })
    // 每天按开始时间排序
    for (let i = 0; i < 7; i++) {
      empty[i].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    }
  }
  durations.value = empty
  originalDurations.value = empty.map(day => day.map(r => ({ ...r })))
}

watch(
  () => props.modelValue,
  (val) => init(val),
  { immediate: true }
)

// ─── 样式计算 ────────────────────────────────────────────────

const getRangeStyle = (range: TimeRange) => {
  const startMinutes = timeToMinutes(range.start_time)
  const endMinutes = timeToMinutes(range.end_time)
  const leftPercent = (startMinutes / 1440) * 100
  const widthPercent = Math.max(0, ((endMinutes - startMinutes) / 1440) * 100)
  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`
  }
}

// ─── 时间修改（popover 内时间选择器回调）──────────────────────

const onTimeChange = (dayIndex: number) => {
  mergeAndValidate(dayIndex)
}

// ─── 拖拽 ───────────────────────────────────────────────────

const handleMouseDown = (e: MouseEvent, dayIndex: number) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const totalMinutes = Math.round(((x / rect.width) * 1440) / 30) * 30

  dragDayIndex.value = dayIndex
  dragStartMinutes.value = totalMinutes
  isDragging.value = true

  const weekDay = String(dayIndex + 1)
  const newRange: TimeRange = {
    week_day: weekDay,
    start_time: minutesToTime(totalMinutes),
    end_time: minutesToTime(totalMinutes)
  }

  const dayRanges = durations.value[dayIndex] || []
  let inserted = false
  for (let i = 0; i < dayRanges.length; i++) {
    if (timeToMinutes(dayRanges[i].start_time) > totalMinutes) {
      dayRanges.splice(i, 0, newRange)
      inserted = true
      break
    }
  }
  if (!inserted) dayRanges.push(newRange)
  durations.value[dayIndex] = dayRanges
}

const handleMouseMove = (e: MouseEvent, dayIndex: number) => {
  if (!isDragging.value || dragDayIndex.value !== dayIndex) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const totalMinutes = Math.round(((x / rect.width) * 1440) / 30) * 30

  const dayRanges = durations.value[dayIndex]
  if (!dayRanges?.length) return

  const lastRange = dayRanges[dayRanges.length - 1]
  if (totalMinutes > dragStartMinutes.value) {
    lastRange.end_time = minutesToTime(totalMinutes)
  }
}

const handleMouseUp = () => {
  if (isDragging.value) {
    mergeAndValidate(dragDayIndex.value)
    isDragging.value = false
    dragDayIndex.value = -1
  }
}

// ─── 合并验证 ────────────────────────────────────────────────

const mergeAndValidate = (dayIndex?: number) => {
  const start = dayIndex !== undefined && dayIndex >= 0 ? dayIndex : 0
  const end   = dayIndex !== undefined && dayIndex >= 0 ? dayIndex + 1 : 7

  for (let i = start; i < end; i++) {
    let ranges = [...(durations.value[i] || [])]

    // 排序
    ranges.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

    // 移除无效段
    ranges = ranges.filter(r => timeToMinutes(r.start_time) < timeToMinutes(r.end_time))

    // 合并重叠
    for (let j = ranges.length - 1; j > 0; j--) {
      const prev = ranges[j - 1]
      const curr = ranges[j]
      if (timeToMinutes(curr.start_time) <= timeToMinutes(prev.end_time)) {
        // 取更晚的结束时间
        if (timeToMinutes(curr.end_time) > timeToMinutes(prev.end_time)) {
          prev.end_time = curr.end_time
        }
        ranges.splice(j, 1)
      }
    }

    durations.value[i] = ranges
  }

  emitChanges()
}

// ─── 删除 ────────────────────────────────────────────────────

const removeRange = (dayIndex: number, rangeIndex: number) => {
  const ranges = [...(durations.value[dayIndex] || [])]
  ranges.splice(rangeIndex, 1)
  durations.value[dayIndex] = ranges
  emitChanges()
}

// ─── 工具按钮 ────────────────────────────────────────────────

const reset = () => {
  durations.value = originalDurations.value.map(day => day.map(r => ({ ...r })))
  emitChanges()
}

const selectAll = () => {
  for (let i = 0; i < 7; i++) {
    durations.value[i] = [{
      week_day: String(i + 1),
      start_time: '00:00',
      end_time: '24:00'
    }]
  }
  emitChanges()
}

const unselectAll = () => {
  durations.value = [[], [], [], [], [], [], []]
  emitChanges()
}

// ─── 复制到其他天 ────────────────────────────────────────────

const copyToTargets = (fromIndex: number) => {
  const targets = copyTargets.value[fromIndex]
  if (!targets.length) {
    ElMessage.warning('请至少选择一天')
    return
  }
  const sourceRanges = durations.value[fromIndex] || []
  targets.forEach((toIndex) => {
    if (toIndex === fromIndex) return
    const weekDay = String(toIndex + 1)
    durations.value[toIndex] = sourceRanges.map(r => ({
      ...r,
      week_day: weekDay
    }))
  })
  closeCopyPopover(fromIndex)
  // 清空选择
  copyTargets.value[fromIndex] = []
  emitChanges()
  ElMessage.success(`已复制到 ${targets.length} 天`)
}

// ─── emit ────────────────────────────────────────────────────

const emitChanges = () => {
  // 展平为一维数组
  const flat: SelectorRange[] = durations.value.flat()
  emit('update:modelValue', flat)
}

// ─── 对外暴露 ────────────────────────────────────────────────

const initPlan = (data: SelectorRange[] | string | null = null) => {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  init(parsed)
}

const getPlan = (): SelectorRange[] => {
  mergeAndValidate()
  return durations.value.flat()
}

const isModify = (): boolean => {
  return JSON.stringify(durations.value) !== JSON.stringify(originalDurations.value)
}

defineExpose({ initPlan, getPlan, isModify })

// ─── 全局鼠标事件 ────────────────────────────────────────────

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
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .plan-day-label {
    width: 60px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .plan-day-content {
    flex: 1;
    background: white;
    border: 1px solid #ddd;
  }

  .plan-day-copy {
    flex-shrink: 0;
    margin-left: 8px;
  }

  .plan-scale {
    position: relative;
    height: 28px;
    border-bottom: 1px solid #ddd;
    background: #fafafa;

    .scale-major {
      position: absolute;
      top: 0;
      height: 100%;
      font-size: 10px;
      color: #888;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: 2px;
      white-space: nowrap;
      user-select: none;

      // 0:00 左对齐
      &.scale-major--first {
        transform: translateX(0);
      }
      // 24:00 右对齐（避免溢出容器）
      &.scale-major--last {
        transform: translateX(-100%);
      }

      // 刻度线
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 1px;
        height: 6px;
        background: #bbb;
        transform: translateX(-50%);
      }
    }

    .scale-minor {
      position: absolute;
      bottom: 0;
      width: 1px;
      height: 4px;
      background: #ddd;
      transform: translateX(-50%);
    }
  }

  .plan-time-area {
    position: relative;
    height: 50px;
    cursor: crosshair;
    user-select: none;
  }

  .plan-time-range {
    position: absolute;
    top: 2px;
    height: calc(100% - 4px);
    background: var(--el-color-primary);
    opacity: 0.75;
    border-radius: 3px;
    cursor: pointer;
    transition: opacity 0.15s;

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
    gap: 10px;

    .range-editor-times {
      display: flex;
      align-items: center;
      gap: 4px;

      .range-sep {
        color: var(--text-muted);
        flex-shrink: 0;
      }
    }

    .range-editor-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  .copy-popover {
    .copy-title {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .copy-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .copy-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      margin-top: 10px;
    }
  }
}
</style>
