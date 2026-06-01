<template>
  <el-drawer
    :model-value="modelValue"
    title="创建合并任务"
    size="560px"
    @close="handleClose"
    @open="onOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <!-- 设备-通道选择 -->
      <el-form-item label="选择通道" prop="channel_id">
        <div class="channel-selector">
          <el-input
            :model-value="selectedLabel"
            placeholder="请在下方树中选择设备通道"
            readonly
          >
            <template #prefix>
              <span v-if="form.device_id" style="color: var(--el-color-success); font-weight: bold;">&#10003;</span>
            </template>
            <template #suffix>
              <el-icon v-if="form.channel_id" class="clear-icon" @click="clearSelection"><Close /></el-icon>
            </template>
          </el-input>
          <div class="tree-wrapper">
            <el-input
              v-model="treeFilter"
              placeholder="搜索设备/通道"
              clearable
              size="small"
              class="tree-search"
            />
            <el-tree
              ref="treeRef"
              :data="deviceTree"
              :props="{ children: 'children', label: 'label' }"
              node-key="id"
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              highlight-current
              default-expand-all
              class="device-channel-tree"
              @node-click="handleNodeClick"
            >
              <template #default="{ data }">
                <div class="tree-node" :class="{ selected: isNodeSelected(data) }">
                  <span class="status-dot" :class="data.status === 'online' ? 'online' : 'offline'" />
                  <span class="node-label">{{ data.label || data.name }}</span>
                  <el-tag v-if="data.type === 'device'" size="small" type="info" class="node-tag">设备</el-tag>
                  <el-tag v-else size="small" class="node-tag">通道</el-tag>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="时间范围" prop="timeRange">
        <el-date-picker
          v-model="form.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="X"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// @ts-ignore
import { Close } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'
import { recordMergeApi } from '@/api/recordMergeApi'

interface TreeNode {
  id: string
  label?: string
  name?: string
  type: 'device' | 'channel'
  device_id?: string
  channel_id?: string
  status?: string
  children?: TreeNode[]
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const treeRef = ref<InstanceType<typeof import('element-plus')['ElTree']>>()
const submitting = ref(false)
const treeFilter = ref('')
const deviceTree = ref<TreeNode[]>([])

const defaultForm = () => ({
  device_id: '',
  channel_id: '',
  timeRange: null as [string, string] | null
})

const form = ref(defaultForm())

const rules: FormRules = {
  channel_id: [{ required: true, message: '请选择设备通道', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }]
}

const selectedLabel = computed(() => {
  if (!form.value.channel_id) return ''
  return `${form.value.device_id} / ${form.value.channel_id}`
})

const isNodeSelected = (data: TreeNode) => {
  return data.type === 'channel' && data.device_id === form.value.device_id && data.channel_id === form.value.channel_id
}

// 搜索过滤
const filterNode = (value: string, data: TreeNode) => {
  if (!value) return true
  const label = data.label || data.name || ''
  return label.toLowerCase().includes(value.toLowerCase())
}

watch(treeFilter, (val) => {
  treeRef.value?.filter(val)
})

// 加载设备树
const loadDeviceTree = async () => {
  try {
    const response = await gb28181Api.getDeviceTree()
    if (response && Array.isArray(response)) {
      deviceTree.value = response
    } else {
      deviceTree.value = []
    }
  } catch (e: any) {
    ElMessage.error(e.message || '获取设备树失败')
    deviceTree.value = []
  }
}

// 点击树节点
const handleNodeClick = (data: TreeNode) => {
  if (data.type === 'channel' && data.device_id && data.channel_id) {
    form.value.device_id = data.device_id
    form.value.channel_id = data.channel_id
  }
}

// 清空选择
const clearSelection = () => {
  form.value.device_id = ''
  form.value.channel_id = ''
  treeRef.value?.setCurrentKey(null)
}

const onOpen = () => {
  form.value = defaultForm()
  treeFilter.value = ''
  loadDeviceTree()
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  if (!form.value.timeRange) return

  submitting.value = true
  try {
    await recordMergeApi.createTask({
      device_id: form.value.device_id,
      channel_id: form.value.channel_id,
      start_time: Number(form.value.timeRange[0]),
      end_time: Number(form.value.timeRange[1])
    })
    ElMessage.success('合并任务已创建')
    emit('update:modelValue', false)
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.clear-icon {
  cursor: pointer;
  color: var(--el-text-color-placeholder);

  &:hover {
    color: var(--el-color-danger);
  }
}

.channel-selector {
  width: 100%;

  .tree-wrapper {
    margin-top: 8px;
    border: 1px solid var(--border-base);
    border-radius: 4px;
    overflow: hidden;

    .tree-search {
      :deep(.el-input__wrapper) {
        border-radius: 0;
        border-bottom: 1px solid var(--border-base);
        box-shadow: none;
      }
    }

    .device-channel-tree {
      max-height: 320px;
      overflow-y: auto;
      padding: 4px 0;

      .tree-node {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 2px 0;
        flex: 1;
        font-size: 13px;

        &.selected {
          color: var(--el-color-primary);
          font-weight: 500;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;

          &.online { background: var(--el-color-success); }
          &.offline { background: var(--el-color-info); }
        }

        .node-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .node-tag {
          flex-shrink: 0;
          transform: scale(0.8);
        }
      }
    }
  }
}
</style>
