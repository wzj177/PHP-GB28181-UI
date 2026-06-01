<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElInput, ElSelect, ElOption, ElDialog, ElForm, ElFormItem, ElMessage, ElPopconfirm, ElSwitch, ElMessageBox } from 'element-plus'
import type { FormRules } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Lock, Unlock } from '@element-plus/icons-vue'
import { permissionApi, type User as ApiUser, type UserRole } from '@/api/permissionApi'

interface User extends ApiUser {}

const loading = ref(false)
const users = ref<User[]>([])
const roleOptions = ref<Array<{ value: string; label: string }>>([])
const total = ref(0)

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const userFormRef = ref()

// Filters
const filters = ref({
  keyword: '',
  start: 0,
  limit: 20
})

// User form
const userForm = ref({
  id: 0,
  email: '',
  nickname: '',
  password: '',
  roles: [] as string[]
})

const formRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '长度在 6 到 32 个字符', trigger: 'blur' }
  ],
  roles: [
    { required: true, message: '请选择角色', trigger: 'change', type: 'array' }
  ]
}

// API Key Dialog
const apiKeyDialogVisible = ref(false)
const apiKeyData = ref({
  api_key: '',
  api_enabled: 0,
  userId: 0
})

// Load users
const loadUsers = async () => {
  loading.value = true
  try {
    const params: any = {
      start: filters.value.start,
      limit: filters.value.limit
    }

    const response = await permissionApi.getUsers(params)

    if (response) {
      users.value = response.list || []
      total.value = response.total || 0
    }
  } catch (error: any) {
    console.error('Failed to load users:', error)
    ElMessage.error(error.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// Load role options
const loadRoleOptions = async () => {
  try {
    const response = await permissionApi.getUserRoleOptions()
    if (response) {
      roleOptions.value = response
    }
  } catch (error: any) {
    console.error('Failed to load role options:', error)
  }
}

// Format role names from roles array
const formatRoles = (roles?: UserRole[]) => {
  if (!roles || roles.length === 0) return '-'
  return roles.map(r => r.name).join(', ')
}

// Get role codes as array
const getRoleCodes = (roles?: UserRole[]) => {
  if (!roles || roles.length === 0) return []
  return roles.map(r => r.code)
}

// Search
const searchUsers = () => {
  filters.value.start = 0
  loadUsers()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    keyword: '',
    start: 0,
    limit: 20
  }
  loadUsers()
}

// Open create dialog
const openCreateDialog = () => {
  dialogMode.value = 'create'
  userForm.value = {
    id: 0,
    email: '',
    nickname: '',
    password: '',
    roles: []
  }
  dialogVisible.value = true
}

// Open edit dialog
const openEditDialog = (user: User) => {
  dialogMode.value = 'edit'
  userForm.value = {
    id: user.id,
    email: user.email,
    nickname: user.nickname || '',
    password: '',
    roles: getRoleCodes(user.roles)
  }
  dialogVisible.value = true
}

// Submit form
const submitForm = async () => {
  await userFormRef.value?.validate()

  const data: any = {
    email: userForm.value.email,
    nickname: userForm.value.nickname,
    roles: userForm.value.roles
  }

  if (dialogMode.value === 'create') {
    data.password = userForm.value.password
  } else if (userForm.value.password) {
    data.password = userForm.value.password
  }

  try {
    if (dialogMode.value === 'create') {
      await permissionApi.createUser(data)
      ElMessage.success('创建成功')
    } else {
      await permissionApi.updateUser(userForm.value.id, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    console.error('Failed to save user:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

// Delete user
const deleteUser = async (user: User) => {
  try {
    await permissionApi.deleteUser(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    ElMessage.error(error.message || '删除失败')
  }
}

// Toggle lock status
const toggleLock = async (user: User) => {
  try {
    const newLocked = user.locked === 0 ? 1 : 0
    await permissionApi.toggleUserLock(user.id, newLocked === 1)
    user.locked = newLocked
    ElMessage.success(newLocked === 1 ? '用户已锁定' : '用户已解锁')
  } catch (error: any) {
    console.error('Failed to toggle lock:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// Generate API Key
const generateApiKey = async (user: User) => {
  try {
    // If user already has API key, confirm reset
    if (user.api_key) {
      await ElMessageBox.confirm(
        '该用户已存在 API Key，是否重新生成？',
        '确认重置',
        { type: 'warning' }
      )
    }

    const result = await permissionApi.generateApiKey(user.id)
    apiKeyData.value = {
      api_key: result.api_key,
      api_enabled: result.api_enabled,
      userId: user.id
    }
    apiKeyDialogVisible.value = true

    // Update user data
    user.api_key = result.api_key
    user.api_enabled = result.api_enabled
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to generate API key:', error)
      ElMessage.error(error.message || '生成 API Key 失败')
    }
  }
}

// Copy API Key to clipboard
const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(
      () => ElMessage.success('已复制到剪贴板'),
      () => fallbackCopy(text)
    )
  } else {
    fallbackCopy(text)
  }
}

const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
  document.body.removeChild(textarea)
}

const copyApiKey = () => copyToClipboard(apiKeyData.value.api_key)

// Copy existing API Key
const copyExistingApiKey = (user: User) => {
  if (!user.api_key) {
    ElMessage.warning('该用户暂无 API Key')
    return
  }
  copyToClipboard(user.api_key)
}

// Toggle API Key
const toggleApiKey = async (user: User) => {
  try {
    const result = await permissionApi.toggleApiKey(user.id)
    user.api_enabled = result.api_enabled
    ElMessage.success(result.api_enabled ? 'API Key 已启用' : 'API Key 已禁用')
  } catch (error: any) {
    console.error('Failed to toggle API key:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// Pagination
const handlePageChange = (page: number) => {
  filters.value.start = (page - 1) * filters.value.limit
  loadUsers()
}

const handleSizeChange = (size: number) => {
  filters.value.limit = size
  filters.value.start = 0
  loadUsers()
}

// Format date
const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

onMounted(() => {
  loadUsers()
  loadRoleOptions()
})
</script>

<template>
  <div class="user-management-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadUsers">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建用户</el-button>
      </div>
    </div>

    <div class="stats-content">
      <ElCard class="stats-card full-width">
        <!-- Filters -->
        <div class="filter-bar">
          <el-input v-model="filters.keyword" placeholder="搜索邮箱/用户名" style="width: 250px" clearable />

          <el-button type="primary" @click="searchUsers">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <!-- Table -->
        <ElTable
          v-loading="loading"
          :data="users"
          style="width: 100%"
          stripe
        >
          <ElTableColumn prop="id" label="ID" width="80" />

          <ElTableColumn prop="email" label="邮箱" min-width="200" />

          <ElTableColumn prop="nickname" label="用户名" width="150">
            <template #default="{ row }">
              {{ row.nickname || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="roles" label="角色" width="200">
            <template #default="{ row }">
              <ElTag v-for="(role, idx) in (row.roles || [])" :key="idx" size="small" style="margin-right: 4px">
                {{ role.name }}
              </ElTag>
              <span v-if="!row.roles || row.roles.length === 0">-</span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="locked" label="状态" width="80">
            <template #default="{ row }">
              <ElTag :type="row.locked ? 'danger' : 'success'" size="small">
                {{ row.locked ? '锁定' : '正常' }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="api_enabled" label="OpenAPI" width="110" align="center">
            <template #default="{ row }">
              <ElSwitch
                v-if="row.api_key"
                :model-value="row.api_enabled === 1"
                @change="toggleApiKey(row)"
              />
              <span v-else style="color: var(--el-text-color-placeholder); font-size: 12px;">未申请</span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="loginTime" label="最后登录" width="170">
            <template #default="{ row }">
              {{ formatDate(row.loginTime) }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="loginIp" label="登录IP" width="130">
            <template #default="{ row }">
              {{ row.loginIp || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="createdTime" label="创建时间" width="170">
            <template #default="{ row }">
              {{ formatDate(row.createdTime) }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" width="430" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                v-if="row.api_key"
                size="small"
                @click="copyExistingApiKey(row)"
              >
                复制 Key
              </el-button>
              <el-button size="small" type="warning" @click="generateApiKey(row)">
                {{ row.api_key ? '重置 Key' : '申请 Key' }}
              </el-button>
              <el-button size="small" :icon="row.locked ? Unlock : Lock" @click="toggleLock(row)">
                {{ row.locked ? '解锁' : '锁定' }}
              </el-button>
              <el-popconfirm title="确定要删除这个用户吗？" @confirm="deleteUser(row)">
                <template #reference>
                  <el-button size="small" type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </ElTableColumn>
        </ElTable>

        <!-- Pagination -->
        <div class="pagination">
          <el-pagination
            :current-page="Math.floor(filters.start / filters.limit) + 1"
            :page-size="filters.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </ElCard>
    </div>

    <!-- Dialog -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建用户' : '编辑用户'"
      width="600px"
    >
      <ElForm
        ref="userFormRef"
        :model="userForm"
        :rules="formRules"
        label-width="100px"
      >
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="userForm.email" />
        </ElFormItem>

        <ElFormItem label="用户名" prop="nickname">
          <ElInput v-model="userForm.nickname" />
        </ElFormItem>

        <ElFormItem label="密码" :prop="dialogMode === 'create' ? 'password' : ''">
          <ElInput v-model="userForm.password" type="password" show-password :placeholder="dialogMode === 'edit' ? '留空则不修改' : ''" />
        </ElFormItem>

        <ElFormItem label="角色" prop="roles">
          <ElSelect v-model="userForm.roles" style="width: 100%" placeholder="请选择角色" multiple>
            <ElOption v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </ElDialog>

    <!-- API Key Dialog -->
    <ElDialog
      v-model="apiKeyDialogVisible"
      title="OpenAPI Key 生成成功"
      width="500px"
    >
      <div class="api-key-content">
        <div class="api-key-label">您的 API Key:</div>
        <div class="api-key-box">
          <code class="api-key-text">{{ apiKeyData.api_key }}</code>
          <el-button size="small" type="primary" @click="copyApiKey">复制</el-button>
        </div>
        <div class="api-key-tips">
          <p>请妥善保管您的 API Key，泄露可能导致安全风险。</p>
          <p>API Key 用于调用 OpenAPI 接口，请勿分享给他人。</p>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="apiKeyDialogVisible = false">确定</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.user-management-container {
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

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .api-key-content {
    .api-key-label {
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text-main);
    }

    .api-key-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-hover);
      border: 1px solid var(--border-base);
      border-radius: 6px;
      margin-bottom: 16px;

      .api-key-text {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: var(--text-main);
        word-break: break-all;
        line-height: 1.4;
      }
    }

    .api-key-tips {
      padding: 12px;
      background: var(--el-color-warning-light-9);
      border: 1px solid var(--el-color-warning-light-5);
      border-radius: 6px;

      p {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: var(--el-color-warning);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
