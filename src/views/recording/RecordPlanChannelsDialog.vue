<template>
  <ElDrawer
    :model-value="modelValue"
    :title="`通道绑定管理 — ${plan?.name ?? ''}`"
    direction="rtl"
    size="70%"
    @update:model-value="emit('update:modelValue', $event)"
    @open="onOpen"
    @close="onClose"
  >
    <div class="channels-dialog">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <ElInput
          v-model="keyword"
          placeholder="通道名称 / 编号搜索"
          clearable
          style="width: 200px"
          @keyup.enter="search"
          @clear="search"
        />
        <ElSelect v-model="bindFilter" style="width: 120px" @change="search">
          <ElOption label="全部通道" value="all" />
          <ElOption label="已绑定" value="bound" />
          <ElOption label="未绑定" value="unbound" />
        </ElSelect>
        <ElButton type="primary" :icon="Search" @click="search">搜索</ElButton>
        <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
        <template v-if="selectedRows.length > 0">
          <ElDivider direction="vertical" />
          <span class="sel-info">已选 {{ selectedRows.length }} 项</span>
          <ElButton type="primary" size="small" @click="batchBind">批量绑定</ElButton>
          <ElButton type="danger" size="small" plain @click="batchUnbind">批量解绑</ElButton>
        </template>
      </div>

      <!-- 表格 -->
      <ElTable
        ref="tableRef"
        v-loading="tableLoading"
        :data="displayList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="50" />
        <ElTableColumn prop="channel_name" label="通道名称" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="设备名称" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.device_name || row.device_id }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="device_ip" label="设备IP" min-width="140" show-overflow-tooltip />
        <ElTableColumn prop="channel_id" label="通道编号" width="170" show-overflow-tooltip />
        <ElTableColumn label="通道状态" width="90" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === 'online' ? 'success' : 'danger'" size="small">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="录像状态" width="100" align="center">
          <template #default="{ row }">
            <template v-if="boundMap.has(row.id)">
              <ElTag :type="boundMap.get(row.id)!.record_status === 1 ? 'success' : 'info'" size="small">
                {{ boundMap.get(row.id)!.record_status === 1 ? '录像中' : '未录像' }}
              </ElTag>
            </template>
            <span v-else class="text-placeholder">—</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="boundMap.has(row.id)">
              <ElTag type="success" size="small" class="bound-tag">已绑定</ElTag>
              <ElButton type="danger" link size="small" @click="unbindOne(row)">解绑</ElButton>
            </template>
            <ElButton v-else type="primary" link size="small" @click="bindOne(row)">绑定</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页（仅全部/未绑定模式下显示服务端分页） -->
      <div v-if="bindFilter !== 'bound'" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadChannels"
          @current-change="loadChannels"
        />
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TableInstance } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { recordingApi } from '@/api/recordingApi'
import { gb28181Api } from '@/api/gb28181Api'
import type { RecordPlan, RecordPlanChannel } from '@/types/recording'

interface Channel {
  id: number
  channel_id: string
  channel_name: string
  device_id: string
  device_name?: string
  status: string
  channel_type?: string
  [key: string]: any
}

interface Props {
  modelValue: boolean
  plan?: RecordPlan | null
}
const props = withDefaults(defineProps<Props>(), { plan: null })
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'changed'): void
}>()

const tableRef = ref<TableInstance>()
const tableLoading = ref(false)

// 全部通道列表（服务端分页）
const allChannels = ref<Channel[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0 })

// 已绑定通道 map：channel.id → RecordPlanChannel
const boundMap = ref(new Map<number, RecordPlanChannel>())

// 筛选
const keyword = ref('')
const bindFilter = ref<'all' | 'bound' | 'unbound'>('all')

// 多选
const selectedRows = ref<Channel[]>([])
const handleSelectionChange = (rows: Channel[]) => { selectedRows.value = rows }

// 已绑定模式直接从 boundMap 生成列表
const boundChannels = computed<Channel[]>(() =>
  Array.from(boundMap.value.values()).map(c => ({
    id: c.id,
    channel_id: c.channel_id,
    channel_name: c.channel_name,
    device_id: c.device_id,
    status: 'unknown'
  }))
)

const displayList = computed<Channel[]>(() => {
  if (bindFilter.value === 'bound') return boundChannels.value
  return allChannels.value
})

// 加载已绑定通道
const loadBoundChannels = async () => {
  if (!props.plan) return
  try {
    const list = await recordingApi.getPlanChannels(props.plan.id)
    const map = new Map<number, RecordPlanChannel>()
    list.forEach(c => map.set(c.id, c))
    boundMap.value = map
  } catch (e: any) {
    ElMessage.error(e.message || '获取绑定通道失败')
  }
}

// 加载全部通道（含分页）
const loadChannels = async () => {
  if (bindFilter.value === 'bound') return
  tableLoading.value = true
  try {
    const data = await gb28181Api.getAllChannels({
      keyword: keyword.value || undefined,
      page: pagination.value.page,
      page_size: pagination.value.limit
    })
    allChannels.value = data.list || []
    pagination.value.total = data.paginator?.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取通道列表失败')
  } finally {
    tableLoading.value = false
  }
}

const search = () => {
  pagination.value.page = 1
  loadChannels()
}

const resetFilter = () => {
  keyword.value = ''
  bindFilter.value = 'all'
  pagination.value.page = 1
  loadChannels()
}

const onOpen = async () => {
  if (!props.plan) return
  await Promise.all([loadBoundChannels(), loadChannels()])
}

const onClose = () => {
  keyword.value = ''
  bindFilter.value = 'all'
  pagination.value = { page: 1, limit: 20, total: 0 }
  selectedRows.value = []
  allChannels.value = []
  boundMap.value = new Map()
}

// 单个绑定
const bindOne = async (channel: Channel) => {
  if (!props.plan) return
  tableLoading.value = true
  try {
    await recordingApi.bindChannels(props.plan.id, [channel.id])
    ElMessage.success('绑定成功')
    await loadBoundChannels()
    emit('changed')
  } catch (e: any) {
    ElMessage.error(e.message || '绑定失败')
  } finally {
    tableLoading.value = false
  }
}

// 单个解绑
const unbindOne = async (channel: Channel) => {
  await ElMessageBox.confirm(`确定解绑通道 "${channel.channel_name}" 吗？`, '解绑确认', { type: 'warning' })
  tableLoading.value = true
  try {
    await recordingApi.unbindChannel(channel.id)
    ElMessage.success('解绑成功')
    await loadBoundChannels()
    emit('changed')
  } catch (e: any) {
    ElMessage.error(e.message || '解绑失败')
  } finally {
    tableLoading.value = false
  }
}

// 批量绑定
const batchBind = async () => {
  if (!props.plan || selectedRows.value.length === 0) return
  const ids = selectedRows.value.map(r => r.id)
  tableLoading.value = true
  try {
    const res = await recordingApi.bindChannels(props.plan.id, ids)
    ElMessage.success(`已绑定 ${res.count} 个通道`)
    tableRef.value?.clearSelection()
    await loadBoundChannels()
    emit('changed')
  } catch (e: any) {
    ElMessage.error(e.message || '批量绑定失败')
  } finally {
    tableLoading.value = false
  }
}

// 批量解绑
const batchUnbind = async () => {
  if (selectedRows.value.length === 0) return
  const ids = selectedRows.value.map(r => r.id)
  await ElMessageBox.confirm(`确定解绑选中的 ${ids.length} 个通道吗？`, '批量解绑', { type: 'warning' })
  tableLoading.value = true
  try {
    const res = await recordingApi.batchUnbindChannels(ids)
    ElMessage.success(`已解绑 ${res.count} 个通道`)
    tableRef.value?.clearSelection()
    await loadBoundChannels()
    emit('changed')
  } catch (e: any) {
    ElMessage.error(e.message || '批量解绑失败')
  } finally {
    tableLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.channels-dialog {
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .sel-info {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .bound-tag {
    margin-right: 4px;
  }

  .text-placeholder {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
