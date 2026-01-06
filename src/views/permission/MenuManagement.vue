<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElInput, ElSelect, ElOption, ElDialog, ElForm, ElFormItem, ElInputNumber, ElMessage, ElMessageBox, ElRow, ElCol, ElTreeSelect } from 'element-plus'
import { Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import { permissionApi, type MenuItem } from '@/api/permissionApi'
import IconSelector from '@/components/IconSelector.vue'

const loading = ref(false)
const menus = ref<MenuItem[]>([])
const typeOptions = ref<Array<{ value: string; label: string }>>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const menuFormRef = ref()

// Menu form
const menuForm = ref({
  id: 0,
  menuId: '',
  name: '',
  icon: '',
  path: '',
  component: '',
  parentId: 0,
  sort: 0,
  type: 'menu' as 'menu' | 'directory' | 'path' | 'api',
  status: 1
})

// Load menus
const loadMenus = async () => {
  loading.value = true
  try {
    const response = await permissionApi.getMenuTree()
    if (response) {
      menus.value = response || []
    }
  } catch (error: any) {
    console.error('Failed to load menus:', error)
    ElMessage.error(error.message || '加载菜单失败')
  } finally {
    loading.value = false
  }
}

// Load type options
const loadTypeOptions = async () => {
  try {
    const response = await permissionApi.getMenuTypeOptions()
    if (response) {
      typeOptions.value = response
    }
  } catch (error: any) {
    console.error('Failed to load type options:', error)
  }
}

// Open create dialog
const openCreateDialog = (parentId: number = 0) => {
  dialogMode.value = 'create'
  menuForm.value = {
    id: 0,
    menuId: '',
    name: '',
    icon: '',
    path: '',
    component: '',
    parentId,
    sort: 0,
    type: 'menu',
    status: 1
  }
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (menu: MenuItem) => {
  dialogMode.value = 'edit'
  menuForm.value = {
    id: menu.id,
    menuId: menu.menuId,
    name: menu.name,
    icon: menu.icon || '',
    path: menu.path,
    component: menu.component || '',
    parentId: menu.parentId,
    sort: menu.sort,
    type: menu.type,
    status: menu.status || 1
  }
  dialogVisible.value = true
}

// Submit form
const submitForm = async () => {
  try {
    const data: any = {
      menuId: menuForm.value.menuId,
      name: menuForm.value.name,
      icon: menuForm.value.icon,
      path: menuForm.value.path,
      component: menuForm.value.component,
      parentId: menuForm.value.parentId || 0,
      sort: menuForm.value.sort,
      type: menuForm.value.type,
      status: menuForm.value.status
    }

    if (dialogMode.value === 'create') {
      await permissionApi.createMenu(data)
      ElMessage.success('创建成功')
    } else {
      await permissionApi.updateMenu(menuForm.value.id, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadMenus()
  } catch (error: any) {
    console.error('Failed to save menu:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

// Delete menu
const deleteMenu = async (menu: MenuItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除菜单 "${menu.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await permissionApi.deleteMenu(menu.id)
    ElMessage.success('删除成功')
    loadMenus()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete menu:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Get type tag
const getTypeTag = (type: string) => {
  const map: Record<string, { type: string; label: string }> = {
    'menu': { type: 'primary', label: '菜单' },
    'directory': { type: 'success', label: '目录' },
    'path': { type: 'info', label: '路径' },
    'api': { type: 'warning', label: 'API' }
  }
  return map[type] || { type: 'info', label: type }
}

// 获取可选择的父级菜单（排除自己和子菜单）
const parentMenuOptions = computed(() => {
  if (dialogMode.value === 'create') {
    // 新建时，返回所有菜单
    return menus.value
  } else {
    // 编辑时，需要排除自己和所有子菜单
    const excludeIds = new Set<number>()

    const collectChildIds = (items: MenuItem[], currentId: number) => {
      for (const item of items) {
        if (item.id === currentId) {
          excludeIds.add(item.id)
          if (item.children) {
            for (const child of item.children) {
              excludeIds.add(child.id)
              if (child.children) {
                collectChildIds(child.children, child.id)
              }
            }
          }
        } else if (item.children) {
          collectChildIds(item.children, currentId)
        }
      }
    }

    collectChildIds(menus.value, menuForm.value.id)

    const filterMenus = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter(item => !excludeIds.has(item.id))
        .map(item => ({
          ...item,
          children: item.children ? filterMenus(item.children) : undefined
        }))
    }

    return filterMenus(menus.value)
  }
})

// 处理父级菜单的显示值，当为 0 时不显示
const parentMenuValue = computed({
  get: () => menuForm.value.parentId || undefined,
  set: (val) => {
    menuForm.value.parentId = val || 0
  }
})

onMounted(() => {
  loadMenus()
  loadTypeOptions()
})
</script>

<template>
  <div class="menu-management-container">
    <div class="page-header">
      <h2>菜单管理</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadMenus">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog()">新建菜单</el-button>
      </div>
    </div>

    <div class="stats-content">
      <ElCard class="stats-card full-width">
        <ElTable
          v-loading="loading"
          :data="menus"
          style="width: 100%"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          stripe
        >
          <ElTableColumn prop="name" label="菜单名称" min-width="200">
            <template #default="{ row }">
              {{ row.name }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="menuId" label="菜单标识" min-width="150" />

          <ElTableColumn prop="icon" label="图标" width="100">
            <template #default="{ row }">
              {{ row.icon || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="path" label="路径" min-width="180" />

          <ElTableColumn prop="component" label="组件" width="150">
            <template #default="{ row }">
              {{ row.component || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="type" label="类型" width="80">
            <template #default="{ row }">
              <ElTag :type="getTypeTag(row.type).type" size="small">
                {{ getTypeTag(row.type).label }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="sort" label="排序" width="80" />

          <ElTableColumn prop="status" label="状态" width="80">
            <template #default="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Plus" @click="openCreateDialog(row.id)" v-if="row.type === 'directory'">添加子菜单</el-button>
              <el-button size="small" :icon="Plus" @click="openCreateDialog(row.id)" v-else-if="row.type === 'menu'">添加api权限</el-button>
              <el-button size="small" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="deleteMenu(row)">删除</el-button>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>

    <!-- Dialog -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建菜单' : '编辑菜单'"
      width="700px"
    >
      <ElForm
        ref="menuFormRef"
        :model="menuForm"
        label-width="100px"
      >
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="类型" required>
              <ElSelect v-model="menuForm.type" style="width: 100%">
                <ElOption v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="排序">
              <ElInputNumber v-model="menuForm.sort" :min="0" style="width: 100%" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="菜单标识" required>
              <ElInput v-model="menuForm.menuId" placeholder="唯一标识，如 dashboard" :disabled="dialogMode === 'edit'" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="菜单名称" required>
              <ElInput v-model="menuForm.name" placeholder="如 仪表盘" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="父级菜单">
              <ElTreeSelect
                v-model="parentMenuValue"
                :data="parentMenuOptions"
                :props="{ label: 'name', value: 'id', children: 'children' }"
                placeholder="请选择父级菜单（不选则为顶级菜单）"
                clearable
                check-strictly
                :render-after-expand="false"
                class="parent-menu-select"
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="路径" required>
              <ElInput v-model="menuForm.path" placeholder="/dashboard" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="组件">
              <ElInput v-model="menuForm.component" placeholder="Dashboard" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="图标">
              <IconSelector v-model="menuForm.icon" />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="状态">
              <ElSelect v-model="menuForm.status" style="width: 100%">
                <ElOption label="启用" :value="1" />
                <ElOption label="禁用" :value="0" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.menu-management-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: $spacing-md;
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);

    h2 {
      margin: 0;
      color: var(--text-main);
      font-size: 18px;
      font-weight: 600;
    }
  }

  .stats-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    .stats-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-base);
      border-radius: $radius-panel;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-card__body) {
        padding: 16px;
      }
    }
  }

  // 隐藏父级菜单选择器的输入文本
  :deep(.parent-menu-select) {
    .el-tree-select__wrapper {
      .el-select__selected-item {
        display: none;
      }
    }
  }
}
</style>
