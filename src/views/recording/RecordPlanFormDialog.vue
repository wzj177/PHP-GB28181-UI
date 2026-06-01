<template>
  <ElDrawer
    :model-value="modelValue"
    :title="planId ? '编辑录像计划' : '新建录像计划'"
    direction="rtl"
    size="65%"
    @update:model-value="emit('update:modelValue', $event)"
    @open="onOpen"
    @close="onClose"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      v-loading="loadingDetail"
    >
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="计划名称" prop="name">
            <ElInput v-model="form.name" placeholder="请输入计划名称" maxlength="50" show-word-limit />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="是否启用" prop="status">
            <ElSwitch v-model="form.statusBool" active-text="启用" inactive-text="禁用" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="天数限制" prop="limit_days">
            <ElInputNumber v-model="form.limit_days" :min="0" :max="3650" style="width: 100%" />
            <div class="form-tip">0 表示不限制天数</div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="空间限制 (GB)" prop="limit_space_gb">
            <ElInputNumber v-model="form.limit_space_gb" :min="0" :max="10240" :step="1" :precision="1" style="width: 100%" />
            <div class="form-tip">0 表示不限制空间</div>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="超限策略" prop="over_step_plan">
            <ElRadioGroup v-model="form.over_step_plan">
              <ElRadioButton value="del_file">删除旧文件</ElRadioButton>
              <ElRadioButton value="stop_record">停止录像</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="备注" prop="remark">
            <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="可选备注" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElFormItem label="录像时段">
        <RecordPlanSelector
          ref="selectorRef"
          v-model="form.plan_ranges_selector"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { recordingApi } from '@/api/recordingApi'
import type { RecordPlanRange, WeekDay, OverStepPlan } from '@/types/recording'
import RecordPlanSelector from '@/components/RecordPlanSelector.vue'

// WeekDay 与 RecordPlanSelector week_day('1'~'7') 互转
const WEEK_TO_IDX: Record<WeekDay, string> = {
  MON: '1', TUE: '2', WED: '3', THU: '4', FRI: '5', SAT: '6', SUN: '7'
}
const IDX_TO_WEEK: Record<string, WeekDay> = {
  '1': 'MON', '2': 'TUE', '3': 'WED', '4': 'THU', '5': 'FRI', '6': 'SAT', '7': 'SUN'
}

interface Props {
  modelValue: boolean
  planId?: number | null
}

const props = withDefaults(defineProps<Props>(), { planId: null })
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const selectorRef = ref<any>()
const loadingDetail = ref(false)
const saving = ref(false)

const defaultForm = () => ({
  name: '',
  statusBool: true,
  limit_days: 0,
  limit_space_gb: 0,
  over_step_plan: 'del_file' as OverStepPlan,
  remark: '',
  plan_ranges_selector: null as any
})
const form = ref(defaultForm())

const rules: FormRules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度 2–50 个字符', trigger: 'blur' }
  ]
}

// 加载详情
const loadDetail = async (id: number) => {
  loadingDetail.value = true
  try {
    const plan = await recordingApi.getPlanDetail(id)
    form.value.name = plan.name
    form.value.statusBool = plan.status === 1
    form.value.limit_days = plan.limit_days
    form.value.limit_space_gb = plan.limit_space ? +(plan.limit_space / 1073741824).toFixed(1) : 0
    form.value.over_step_plan = plan.over_step_plan
    form.value.remark = plan.remark || ''
    // 转换 ranges 格式
    const selectorRanges = (plan.ranges || []).map(r => ({
      week_day: WEEK_TO_IDX[r.week_day] ?? '1',
      start_time: r.start_time,
      end_time: r.end_time
    }))
    selectorRef.value?.initPlan(selectorRanges)
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  } finally {
    loadingDetail.value = false
  }
}

const onOpen = () => {
  form.value = defaultForm()
  selectorRef.value?.initPlan(null)
  if (props.planId) loadDetail(props.planId)
}

const onClose = () => {
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  await formRef.value?.validate()

  // 把 selector 的 ranges 转换回 API 格式
  const selectorResult: { week_day: string; start_time: string; end_time: string }[] =
    selectorRef.value?.getPlan() ?? []
  const ranges: Omit<RecordPlanRange, 'id' | 'record_plan_id'>[] = selectorResult.map(r => ({
    week_day: IDX_TO_WEEK[r.week_day] ?? 'MON',
    start_time: r.start_time,
    end_time: r.end_time
  }))

  const payload = {
    name: form.value.name,
    status: form.value.statusBool ? 1 : 0,
    limit_days: form.value.limit_days,
    limit_space: form.value.limit_space_gb ? Math.round(form.value.limit_space_gb * 1073741824) : 0,
    over_step_plan: form.value.over_step_plan,
    remark: form.value.remark,
    ranges
  }

  saving.value = true
  try {
    if (props.planId) {
      await recordingApi.updatePlan(props.planId, payload)
      ElMessage.success('更新成功')
    } else {
      await recordingApi.createPlan(payload)
      ElMessage.success('创建成功')
    }
    emit('update:modelValue', false)
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  line-height: 1.4;
}

:deep(.el-drawer__body) {
  padding: 20px;
  overflow-y: auto;
}
:deep(.el-drawer__footer) {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
