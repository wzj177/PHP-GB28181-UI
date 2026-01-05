<template>
  <div class="attachment-group" v-loading="loading">
    <div class="head-operation">
      <ul class="operation-list">
        <li class="list-item" @click="refreshData">
          <el-tooltip content="刷新" placement="top">
            <ElIcon :size="16"><Refresh /></ElIcon>
          </el-tooltip>
        </li>
        <li class="list-item" @click="handleAddCatalog(0)">
          <el-tooltip content="添加" placement="top">
            <ElIcon :size="16"><Plus /></ElIcon>
          </el-tooltip>
        </li>
      </ul>
    </div>

    <div class="catalog-item">
      <ElTree
        ref="customTreeRef"
        node-key="id"
        :data="catalogItems"
        :props="defaultProps"
        :default-expand-all="true"
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node show-hide">
            <span>
              <span class="folder-icon">📁</span>
              {{ node.label }}
            </span>
            <span class="custom-tree-node-span">
              <!-- 增加节点 -->
              <ElIcon
                v-if="node.level === 1"
                :size="14"
                @click.stop="appendNode(node, data)"
                title="增加"
              >
                <Plus />
              </ElIcon>
              <!-- 删除节点 - 根节点不需要删除 -->
              <ElIcon
                v-if="parseInt(data.is_default) !== 1"
                :size="14"
                @click.stop="removeNode(node, data)"
                title="删除"
              >
                <Delete />
              </ElIcon>
              <!-- 编辑节点 -->
              <ElIcon
                :size="14"
                @click.stop="editNode(node, data)"
                title="编辑"
              >
                <Edit />
              </ElIcon>
            </span>
          </span>
        </template>
      </ElTree>
    </div>

    <CatalogForm ref="catalogFormRef" @ok="refreshData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { Refresh, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { attachmentApi, type AttachmentCatalog, type CatalogFormData } from '@/api/attachmentApi'
import CatalogForm from './CatalogForm.vue'

interface Emits {
  (e: 'changeCatalog', catalogCode: string): void
  (e: 'refreshData', refreshFile: boolean): void
}

const emit = defineEmits<Emits>()

const loading = ref(false)
const customTreeRef = ref<InstanceType<typeof ElTree>>()
const catalogFormRef = ref<InstanceType<typeof CatalogForm>>()
const catalogItems = ref<AttachmentCatalog[]>([])
const active_catalog_id = ref<number>()

const defaultProps = {
  children: 'children',
  label: 'title'
}

// 新增树节点
const appendNode = (node: any, data: AttachmentCatalog) => {
  handleAddCatalog(data.id)
}

// 删除树节点
const removeNode = (node: any, data: AttachmentCatalog) => {
  // 判断该节点是否有子节点
  if (node.childNodes?.length !== 0) {
    ElMessage.warning('该节点下存在子节点，不允许直接删除')
    return
  }

  ElMessageBox.confirm('是否确认删除此节点?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await handleDelCatalog(data.id)
      customTreeRef.value?.remove(data)
    })
    .catch(() => {})
}

// 编辑树节点
const editNode = (node: any, data: AttachmentCatalog) => {
  handleEditCatalog(data)
}

// 处理节点点击
const handleNodeClick = (data: AttachmentCatalog) => {
  active_catalog_id.value = data.id
  emit('changeCatalog', data.code)
}

// 添加分组
const handleAddCatalog = (parentId = 0) => {
  catalogFormRef.value?.open('add', {
    parent_id: parentId,
    title: '',
    code: '',
    is_default: 0,
    sort: 50
  })
}

// 编辑分组
const handleEditCatalog = async (data: AttachmentCatalog) => {
  const catalog = await attachmentApi.showCatalog(data.id)
  catalogFormRef.value?.open('edit', catalog as CatalogFormData)
}

// 删除分组
const handleDelCatalog = async (id: number) => {
  await attachmentApi.delCatalog([id])
  emit('refreshData', active_catalog_id.value === id)
}

// 刷新数据
const refreshData = () => {
  getCatalogTree()
  emit('refreshData', false)
}

// 获取目录树
const getCatalogTree = async () => {
  loading.value = true
  try {
    const trees = await attachmentApi.getCatalogTree()
    catalogItems.value = trees
  } catch (error) {
    console.error('Failed to get catalog tree:', error)
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 1500)
  }
}

onMounted(() => {
  getCatalogTree()
})
</script>

<style lang="scss" scoped>
.attachment-group {
  border: 1px solid #e6ebf5;
  background: var(--bg-panel);
  border-radius: 4px;
  overflow: hidden;

  .head-operation {
    height: 50px;
    background: #fff;
    border-bottom: 1px dashed #e4e4e4;

    .operation-list {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 100%;
      margin: 0;
      padding: 0;
      list-style: none;

      .list-item {
        width: 25px;
        height: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        transition: color 0.3s;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .catalog-item {
    .custom-tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      padding-right: 8px;

      .folder-icon {
        margin-right: 6px;
      }

      .custom-tree-node-span {
        display: none;
      }
    }

    .show-hide:hover .custom-tree-node-span {
      display: inline-flex;
      gap: 4px;

      .el-icon {
        padding: 2px;
        cursor: pointer;
        color: var(--text-secondary);

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    :deep(.el-tree-node__content) {
      height: 40px;
    }
  }
}
</style>
