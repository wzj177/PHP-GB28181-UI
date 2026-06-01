<template>
  <div class="alarm-plan-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>报警计划管理</h2>
      <p class="page-description">配置报警联动规则，包括录像和快照设置</p>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" :value="null" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList" :icon="Search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
        <div style="flex: 1"></div>
        <el-form-item>
          <el-button type="primary" @click="openCreateDialog" :icon="Plus">新建计划</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="计划名称" min-width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="record_duration_sec" label="录像时长" width="120" align="center">
          <template #default="{ row }">
            {{ row.record_duration_sec > 0 ? `${row.record_duration_sec}秒` : '不录像' }}
          </template>
        </el-table-column>
        <el-table-column prop="snapshot_interval_sec" label="快照间隔" width="120" align="center">
          <template #default="{ row }">
            {{ row.snapshot_interval_sec > 0 ? `${row.snapshot_interval_sec}秒` : '不抓拍' }}
          </template>
        </el-table-column>
        <el-table-column prop="alarm_level" label="报警级别" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="level in row.alarm_level"
              :key="level"
              :type="ALARM_LEVEL_CONFIG[level]?.type || 'info'"
              size="small"
              style="margin-right: 4px"
            >
              {{ ALARM_LEVEL_CONFIG[level]?.label || level }}
            </el-tag>
            <span v-if="!row.alarm_level || row.alarm_level.length === 0" class="text-muted">全部</span>
          </template>
        </el-table-column>
        <el-table-column prop="alarm_method" label="报警方式" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="method in row.alarm_method"
              :key="method"
              size="small"
              style="margin-right: 4px"
            >
              {{ ALARM_METHOD_CONFIG[method] || method }}
            </el-tag>
            <span v-if="!row.alarm_method || row.alarm_method.length === 0" class="text-muted">全部</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)" :icon="Edit">编辑</el-button>
            <el-button type="primary" link @click="openChannelBindDialog(row)" :icon="Link">绑定通道</el-button>
            <el-button type="danger" link @click="handleDelete(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑报警计划' : '新建报警计划'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="计划名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入计划名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-form-item label="录像时长(秒)" prop="record_duration_sec">
          <el-input-number
            v-model="form.record_duration_sec"
            :min="0"
            :max="3600"
            :step="10"
            controls-position="right"
            style="width: 200px"
          />
          <span class="form-tip">设置为0表示不录像</span>
        </el-form-item>

        <el-form-item label="快照间隔(秒)" prop="snapshot_interval_sec">
          <el-input-number
            v-model="form.snapshot_interval_sec"
            :min="0"
            :max="3600"
            :step="5"
            controls-position="right"
            style="width: 200px"
          />
          <span class="form-tip">设置为0表示不抓拍</span>
        </el-form-item>

        <el-form-item label="报警级别" prop="alarm_level">
          <el-checkbox-group v-model="form.alarm_level">
            <el-checkbox :label="1">1级（一般）</el-checkbox>
            <el-checkbox :label="2">2级（重要）</el-checkbox>
            <el-checkbox :label="3">3级（紧急）</el-checkbox>
            <el-checkbox :label="4">4级（特急）</el-checkbox>
          </el-checkbox-group>
          <div class="form-tip">不选择则匹配所有级别</div>
        </el-form-item>

        <el-form-item label="报警方式" prop="alarm_method">
          <el-checkbox-group v-model="form.alarm_method">
            <el-checkbox :label="1">电话报警</el-checkbox>
            <el-checkbox :label="2">设备报警</el-checkbox>
            <el-checkbox :label="3">短信报警</el-checkbox>
            <el-checkbox :label="4">GPS 报警</el-checkbox>
            <el-checkbox :label="5">视频报警</el-checkbox>
            <el-checkbox :label="6">设备故障报警</el-checkbox>
            <el-checkbox :label="7">其他报警</el-checkbox>
          </el-checkbox-group>
          <div class="form-tip">不选择则匹配所有方式</div>
        </el-form-item>

        <el-form-item label="报警类型" prop="alarm_type">
          <el-select
            v-model="form.alarm_type"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="不选择则匹配所有类型"
            style="width: 100%"
          >
            <el-option-group label="设备报警 (method=2)">
              <el-option
                v-for="(label, key) in ALARM_TYPE_DEVICE"
                :key="`device-${key}`"
                :label="label"
                :value="Number(key)"
              />
            </el-option-group>
            <el-option-group label="视频报警 (method=5)">
              <el-option
                v-for="(label, key) in ALARM_TYPE_VIDEO"
                :key="`video-${key}`"
                :label="label"
                :value="Number(key)"
              />
            </el-option-group>
            <el-option-group label="设备故障报警 (method=6)">
              <el-option
                v-for="(label, key) in ALARM_TYPE_DEVICE_FAULT"
                :key="`fault-${key}`"
                :label="label"
                :value="Number(key)"
              />
            </el-option-group>
          </el-select>
          <div class="form-tip">报警类型的含义依赖于报警方式</div>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 绑定通道对话框 -->
    <ChannelBindDialog
      v-model:visible="bindDialogVisible"
      :plan-id="currentPlanId"
      :plan-name="currentPlanName"
      @success="loadList"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
// @ts-ignore
import { Search, Plus, Edit, Delete, Link } from '@element-plus/icons-vue'
import { alarmApi } from '@/api/alarmApi'
import type { AlarmPlan } from '@/types/alarm'
import { ALARM_LEVEL_CONFIG, ALARM_METHOD_CONFIG, ALARM_TYPE_DEVICE, ALARM_TYPE_VIDEO, ALARM_TYPE_DEVICE_FAULT } from '@/types/alarm'
import ChannelBindDialog from './ChannelBindDialog.vue'

/* ================= 状态 ================= */

const loading = ref(false)
const saving = ref(false)
const list = ref<AlarmPlan[]>([])

const filters = reactive({
  status: null as number | null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const currentEditId = ref<number>()

// 绑定通道对话框
const bindDialogVisible = ref(false)
const currentPlanId = ref<number>()
const currentPlanName = ref<string>()

/* ================= 表单 ================= */

const form = reactive<AlarmPlan>({
  name: '',
  status: 1,
  remark: '',
  snapshot_interval_sec: 0,
  record_duration_sec: 0,
  alarm_level: [],
  alarm_method: [],
  alarm_type: [],
  alarm_eventtype: []
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  record_duration_sec: [
    { required: true, type: 'number', min: 0, max: 3600, message: '请输入 0-3600 之间的数值', trigger: 'blur' }
  ],
  snapshot_interval_sec: [
    { required: true, type: 'number', min: 0, max: 3600, message: '请输入 0-3600 之间的数值', trigger: 'blur' }
  ]
}

/* ================= 方法 ================= */

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const data = await alarmApi.getAlarmPlans({
      page: pagination.page,
      page_size: pagination.pageSize,
      status: filters.status ?? undefined
    })
    list.value = data.list || []
    pagination.total = data.paginator?.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilters = () => {
  filters.status = null
  pagination.page = 1
  loadList()
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    name: '',
    status: 1,
    remark: '',
    snapshot_interval_sec: 0,
    record_duration_sec: 0,
    alarm_level: [],
    alarm_method: [],
    alarm_type: [],
    alarm_eventtype: []
  })
  isEdit.value = false
  currentEditId.value = undefined
}

// 打开创建对话框
const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (row: AlarmPlan) => {
  resetForm()
  isEdit.value = true
  currentEditId.value = row.id
  Object.assign(form, {
    name: row.name,
    status: row.status,
    remark: row.remark || '',
    snapshot_interval_sec: row.snapshot_interval_sec,
    record_duration_sec: row.record_duration_sec,
    alarm_level: row.alarm_level ? [...row.alarm_level] : [],
    alarm_method: row.alarm_method ? [...row.alarm_method] : [],
    alarm_type: row.alarm_type ? [...row.alarm_type] : [],
    alarm_eventtype: row.alarm_eventtype ? [...row.alarm_eventtype] : []
  })
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      if (isEdit.value && currentEditId.value) {
        await alarmApi.updateAlarmPlan(currentEditId.value, form)
        ElMessage.success('更新成功')
      } else {
        await alarmApi.createAlarmPlan(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadList()
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

// 删除
const handleDelete = (row: AlarmPlan) => {
  ElMessageBox.confirm(
    `确定要删除报警计划"${row.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (row.id) {
        await alarmApi.deleteAlarmPlan(row.id)
        ElMessage.success('删除成功')
        loadList()
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

// 打开绑定通道对话框
const openChannelBindDialog = (row: AlarmPlan) => {
  currentPlanId.value = row.id
  currentPlanName.value = row.name
  bindDialogVisible.value = true
}

/* ================= 生命周期 ================= */

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.alarm-plan-page {
  padding: 16px;
  background: var(--bg-main);
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

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

.text-muted {
  color: var(--text-muted);
}
</style>
