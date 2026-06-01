<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElTree, ElDatePicker, ElButton, ElInput, ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'
import RecordPlayback from '@/views/video/RecordPlayback.vue'

interface DeviceNode {
  id: string
  name?: string
  label?: string
  type: 'device' | 'channel'
  device_id?: string
  channel_id?: string
  status?: string
  device_name?: string
  children?: DeviceNode[]
  [key: string]: any
}

const treeRef = ref()
const treeData = ref<DeviceNode[]>([])
const treeLoading = ref(false)
const treeFilter = ref('')

const selectedDate = ref<string>(formatDate(new Date()))

// 当前选中的通道信息
const currentChannel = ref({
  deviceId: '',
  channelId: '',
  channelPkId: 0,
  channelName: '',
  hasSelection: false
})

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const loadTree = async () => {
  treeLoading.value = true
  try {
    const response = await gb28181Api.getDeviceTree()
    treeData.value = Array.isArray(response) ? response : []
  } catch {
    ElMessage.error('加载设备树失败')
  } finally {
    treeLoading.value = false
  }
}

const handleNodeClick = (node: DeviceNode) => {
  if (node.type !== 'channel') return
  currentChannel.value = {
    deviceId: node.device_id || '',
    channelId: node.channel_id || node.id,
    channelPkId: parseInt(node.id.replace(/\D/g, ''), 10) || 0,
    channelName: `${node.device_name || node.device_id || ''} - ${node.name || node.label || node.id}`,
    hasSelection: true
  }
}

const filterNode = (value: string, data: DeviceNode) => {
  if (!value) return true
  return (data.name || data.label || '').toLowerCase().includes(value.toLowerCase())
}

watch(treeFilter, val => treeRef.value?.filter(val))

onMounted(loadTree)
</script>

<template>
  <div class="playback-page">
    <!-- Left: Device Tree -->
    <div class="tree-panel">
      <div class="panel-header">
        <span class="panel-title">设备树</span>
        <ElButton :icon="Refresh" size="small" circle @click="loadTree" />
      </div>
      <div class="tree-date">
        <ElDatePicker
          v-model="selectedDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 100%"
          size="small"
        />
      </div>
      <div class="tree-search">
        <ElInput
          v-model="treeFilter"
          placeholder="搜索设备/通道"
          clearable
          size="small"
          :prefix-icon="Search"
        />
      </div>
      <div v-loading="treeLoading" class="tree-body">
        <ElTree
          ref="treeRef"
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          :filter-node-method="filterNode"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >
          <template #default="{ data }">
            <div class="tree-node" :class="data.type">
              <span class="status-dot" :class="data.status === 'online' ? 'online' : 'offline'" />
              <span class="node-label">{{ data.name || data.label }}</span>
            </div>
          </template>
        </ElTree>
      </div>
    </div>

    <!-- Right: Embedded RecordPlayback -->
    <div class="playback-panel">
      <RecordPlayback
        v-if="currentChannel.hasSelection"
        :model-value="true"
        :device-id="currentChannel.deviceId"
        :channel-id="currentChannel.channelId"
        :channel-pk-id="currentChannel.channelPkId"
        :channel-name="currentChannel.channelName"
        :selected-date="selectedDate"
      />
      <div v-else class="empty-selection">
        <div class="empty-icon">📹</div>
        <p>请在左侧选择通道进行录像回放</p>
        <p class="empty-sub">点击通道节点开始回放</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playback-page {
  display: flex;
  height: 100%;
  background: $bg-main;
  overflow: hidden;
}

.tree-panel {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: $bg-panel;
  border-right: 1px solid $border-base;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid $border-base;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-main;
}

.tree-date {
  padding: 8px 10px;
  border-bottom: 1px solid $border-base;
}

.tree-search {
  padding: 8px 10px;
  border-bottom: 1px solid $border-base;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  :deep(.el-tree) {
    background: transparent;
    color: $text-main;
  }

  :deep(.el-tree-node__content) {
    height: 36px;

    &:hover {
      background: $bg-hover;
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: $bg-active;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &.online {
    background: $success;
    box-shadow: 0 0 4px $success;
  }

  &.offline {
    background: $danger;
  }
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.playback-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #000;
}

.empty-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $text-muted;
  gap: 8px;
  background: $bg-hover;

  .empty-icon {
    font-size: 48px;
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-size: 14px;
  }

  .empty-sub {
    font-size: 12px;
    color: $text-disabled;
  }
}
</style>
