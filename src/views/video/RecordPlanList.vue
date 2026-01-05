<template>
  <div class="record-plan-list-container">
    <!-- Search and actions -->
    <div class="search-actions">
      <div class="filters">
        <ElInput
          v-model="filters.keyword"
          placeholder="请输入计划名称"
          style="width: 250px; margin-right: 10px;"
          @keyup.enter="searchPlans"
          clearable
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
        <ElButton type="primary" @click="searchPlans">搜索</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
        <ElButton type="primary" @click="openAddDialog">添加录像计划</ElButton>
      </div>
    </div>

    <!-- Plans table -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="plans"
        style="width: 100%"
      >
        <ElTableColumn prop="name" label="计划名称" width="180" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElSwitch
              :model-value="row.status"
              @change="toggleStatus(row)"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="天数限制" width="120">
          <template #default="{ row }">
            {{ row.limit_days }} 天
          </template>
        </ElTableColumn>
        <ElTableColumn label="空间限制" width="120">
          <template #default="{ row }">
            {{ row.limit_space }} GB
          </template>
        </ElTableColumn>
        <ElTableColumn label="超出限制处理" width="140">
          <template #default="{ row }">
            <ElTag :type="row.over_step_plan === 'delFile' ? 'warning' : 'danger'" size="small">
              {{ row.over_step_plan === 'delFile' ? '删除文件' : '停止录制' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="计划描述" show-overflow-tooltip />
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_time) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" type="primary" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton size="small" type="danger" @click="deletePlan(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Form Dialog -->
    <RecordPlanFormDialog
      v-model="formDialog.visible"
      :plan="formDialog.plan"
      @success="onFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { recordPlanApi } from '@/api/recordPlanApi'
import type { RecordPlan } from '@/types/record-plan'
import RecordPlanFormDialog from './RecordPlanFormDialog.vue'

// State
const plans = ref<RecordPlan[]>([])
const loading = ref(false)
const filters = ref({
  keyword: ''
})
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// Form dialog
const formDialog = ref({
  visible: false,
  plan: null as RecordPlan | null
})

// Mock data
const mockPlans: RecordPlan[] = [
  {
    id: 1,
    name: '工作时间录像',
    status: true,
    remark: '周一至周五，朝九晚五',
    limit_space: 50,
    limit_days: 7,
    over_step_plan: 'delFile' as any,
    plan_ranges: [
      { s1: '09:00', e1: '18:00', s2: '09:00', e2: '18:00', s3: '09:00', e3: '18:00', s4: '09:00', e4: '18:00', s5: '09:00', e5: '18:00', s6: null, e6: null, s7: null, e7: null }
    ],
    created_time: Date.now() / 1000 - 86400 * 7,
    updated_time: Date.now() / 1000 - 86400
  },
  {
    id: 2,
    name: '24小时录像',
    status: true,
    remark: '全天候录像',
    limit_space: 500,
    limit_days: 30,
    over_step_plan: 'stopDvr' as any,
    plan_ranges: [
      { s1: '00:00', e1: '24:00', s2: '00:00', e2: '24:00', s3: '00:00', e3: '24:00', s4: '00:00', e4: '24:00', s5: '00:00', e5: '24:00', s6: '00:00', e6: '24:00', s7: '00:00', e7: '24:00' }
    ],
    created_time: Date.now() / 1000 - 86400 * 30,
    updated_time: Date.now() / 1000 - 86400 * 15
  },
  {
    id: 3,
    name: '周末录像',
    status: false,
    remark: '仅周末录像',
    limit_space: 100,
    limit_days: 15,
    over_step_plan: 'delFile' as any,
    plan_ranges: [
      { s1: null, e1: null, s2: null, e2: null, s3: null, e3: null, s4: null, e4: null, s5: null, e5: null, s6: '00:00', e6: '24:00', s7: '00:00', e7: '24:00' }
    ],
    created_time: Date.now() / 1000 - 86400 * 3,
    updated_time: Date.now() / 1000 - 86400
  }
]

// Get plan list
const getPlanList = async () => {
  loading.value = true
  try {
    const params = {
      keyword: filters.value.keyword || undefined,
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize
    }

    const response = await recordPlanApi.getList(params)

    if (response?.code === 0) {
      plans.value = response.data.list || []
      pagination.value.total = response.data.paginator?.total || 0
    } else {
      throw new Error(response?.message || '获取录像计划列表失败')
    }
  } catch (error: any) {
    console.error('Failed to fetch record plan list, using mock data:', error)
    // 使用Mock数据
    let filtered = mockPlans
    if (filters.value.keyword) {
      filtered = mockPlans.filter(p => p.name.includes(filters.value.keyword))
    }
    plans.value = filtered
    pagination.value.total = filtered.length
  } finally {
    loading.value = false
  }
}

// Search plans
const searchPlans = () => {
  pagination.value.currentPage = 1
  getPlanList()
}

// Reset filters
const resetFilters = () => {
  filters.value.keyword = ''
  pagination.value.currentPage = 1
  getPlanList()
}

// Handle page size change
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  getPlanList()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  getPlanList()
}

// Format timestamp
const formatTime = (timestamp?: number): string => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

// Open add dialog
const openAddDialog = () => {
  formDialog.value.plan = null
  formDialog.value.visible = true
}

// Open edit dialog
const openEditDialog = (plan: RecordPlan) => {
  formDialog.value.plan = plan
  formDialog.value.visible = true
}

// Form success handler
const onFormSuccess = () => {
  getPlanList()
}

// Toggle status
const toggleStatus = async (plan: RecordPlan) => {
  try {
    const response = await recordPlanApi.toggleStatus(plan.id, !plan.status)
    if (response?.code === 0) {
      plan.status = !plan.status
      ElMessage.success('状态更新成功')
    } else {
      throw new Error(response?.message || '状态更新失败')
    }
  } catch (error: any) {
    console.error('Failed to toggle status:', error)
    ElMessage.error(error.message || '状态更新失败')
  }
}

// Delete plan
const deletePlan = async (plan: RecordPlan) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除录像计划 "${plan.name}" 吗？删除后将无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await recordPlanApi.delete(plan.id)
    if (response?.code === 0) {
      ElMessage.success('删除成功')
      getPlanList()
    } else {
      throw new Error(response?.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete plan:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Initialize
onMounted(() => {
  getPlanList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.record-plan-list-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .search-actions {
    background: var(--bg-panel);
    padding: 20px;
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    margin-bottom: 16px;

    .filters {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .table-container {
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    padding: 20px;
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}
</style>
