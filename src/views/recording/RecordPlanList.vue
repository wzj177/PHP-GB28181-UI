<template>
  <div class="record-plan-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>录像计划管理</h2>
      <p class="page-description">配置通道云端录像时段及存储策略</p>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="计划名称">
          <el-input
            v-model="filters.name"
            placeholder="请输入计划名称"
            clearable
            style="width: 200px"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
        <div style="flex: 1" />
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="openAdd">新建计划</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="plans" style="width: 100%">
        <el-table-column prop="name" label="计划名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <ElSwitch
              :model-value="row.status === 1"
              @change="(val: boolean) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="绑定通道" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.channel_count ?? 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="天数限制" width="100" align="center">
          <template #default="{ row }">
            {{ row.limit_days > 0 ? `${row.limit_days} 天` : '不限' }}
          </template>
        </el-table-column>
        <el-table-column label="空间限制" width="120" align="center">
          <template #default="{ row }">{{ formatSpace(row.limit_space) }}</template>
        </el-table-column>
        <el-table-column label="超限策略" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.over_step_plan === 'del_file' ? 'warning' : 'danger'" size="small">
              {{ row.over_step_plan === 'del_file' ? '删除旧文件' : '停止录像' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="创建时间" width="175">
          <template #default="{ row }">{{ row.created_at ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link :icon="Link" @click="openChannels(row)">通道</el-button>
            <el-button type="danger" link :icon="Delete" @click="deletePlan(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadPlans"
          @current-change="loadPlans"
        />
      </div>
    </el-card>

    <!-- 表单抽屉 -->
    <RecordPlanFormDialog
      v-model="dialog.visible"
      :plan-id="dialog.planId"
      @success="onSuccess"
    />

    <!-- 通道绑定抽屉 -->
    <RecordPlanChannelsDialog
      v-model="channelDialog.visible"
      :plan="channelDialog.plan"
      @changed="loadPlans"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Link } from '@element-plus/icons-vue'
import { recordingApi } from '@/api/recordingApi'
import type { RecordPlan } from '@/types/recording'
import RecordPlanFormDialog from './RecordPlanFormDialog.vue'
import RecordPlanChannelsDialog from './RecordPlanChannelsDialog.vue'

// ======= 状态 =======
const loading = ref(false)
const plans = ref<RecordPlan[]>([])
const filters = ref({ name: '', status: undefined as number | undefined })
const pagination = ref({ page: 1, limit: 20, total: 0 })

// ======= 弹窗 =======
const dialog = ref({ visible: false, planId: null as number | null })
const channelDialog = ref({ visible: false, plan: null as RecordPlan | null })

// ======= 加载 =======
const loadPlans = async () => {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const data = await recordingApi.getPlanList({
      name: filters.value.name || undefined,
      status: filters.value.status,
      start: offset,
      limit: pagination.value.limit
    })
    plans.value = data.list
    pagination.value.total = data.paginator.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取录像计划失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.page = 1
  loadPlans()
}

const resetFilters = () => {
  filters.value = { name: '', status: undefined }
  search()
}

// ======= 工具函数 =======
const formatSpace = (bytes: number) => {
  if (!bytes) return '不限'
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`
  return `${bytes} B`
}

// ======= 操作 =======
const openAdd = () => {
  dialog.value = { visible: true, planId: null }
}

const openEdit = (plan: RecordPlan) => {
  dialog.value = { visible: true, planId: plan.id }
}

const openChannels = (plan: RecordPlan) => {
  channelDialog.value = { visible: true, plan }
}

const onSuccess = () => loadPlans()

const toggleStatus = async (plan: RecordPlan, checked: boolean) => {
  const newStatus = checked ? 1 : 0
  try {
    await recordingApi.togglePlan(plan.id, newStatus as 0 | 1)
    plan.status = newStatus
    ElMessage.success(checked ? '已启用' : '已禁用')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const deletePlan = async (plan: RecordPlan) => {
  await ElMessageBox.confirm(`确定要删除录像计划 "${plan.name}" 吗？删除后将解绑所有关联通道。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    confirmButtonClass: 'el-button--danger'
  })
  try {
    await recordingApi.deletePlan(plan.id)
    ElMessage.success('删除成功')
    loadPlans()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(() => loadPlans())
</script>

<style scoped lang="scss">
.record-plan-page {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;
}

.page-header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 500;
    color: var(--text-main);
  }

  .page-description {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }
}

.filter-card {
  margin-bottom: 16px;

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}

.table-card {
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
