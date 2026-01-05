<template>
  <ElDrawer
    :model-value="visible"
    :title="isEdit ? '编辑录像计划' : '添加录像计划'"
    direction="rtl"
    size="75%"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="计划名称" prop="name">
            <ElInput v-model="formData.name" placeholder="请输入计划名称" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="是否启用" prop="status">
            <ElSwitch v-model="formData.status" active-text="启用" inactive-text="禁用" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="天数限制" prop="limit_days">
            <ElInputNumber v-model="formData.limit_days" :min="1" :max="30" style="width: 100%;" />
            <span class="form-tip">保存近N天的录像</span>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="空间限制" prop="limit_space">
            <ElInputNumber v-model="formData.limit_space" :min="0.5" :max="500" :step="0.5" style="width: 100%;" />
            <span class="form-tip">空间大小限制（GB）</span>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="超出限制" prop="over_step_plan">
            <ElRadioGroup v-model="formData.over_step_plan">
              <ElRadioButton value="delFile">删除文件</ElRadioButton>
              <ElRadioButton value="stopDvr">停止录制</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="计划描述" prop="remark">
            <ElInput v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入计划描述" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow>
        <ElCol :span="24">
          <ElFormItem label="计划明细">
            <RecordPlanSelector
              ref="recordPlanSelectorRef"
              v-model="formData.plan_ranges"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <div class="drawer-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { recordPlanApi } from '@/api/recordPlanApi'
import type { RecordPlan, RecordPlanFormData, RecordPlanRange } from '@/types/record-plan'
import RecordPlanSelector from '@/components/RecordPlanSelector.vue'

interface Props {
  modelValue: boolean
  plan?: RecordPlan | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.plan)

const formRef = ref<FormInstance>()
const recordPlanSelectorRef = ref()
const submitting = ref(false)

const formData = ref<RecordPlanFormData>({
  name: '',
  status: true,
  remark: '',
  limit_space: 10,
  limit_days: 7,
  over_step_plan: 'delFile' as any,
  plan_ranges: null
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, message: '名称至少2个字符', trigger: 'blur' }
  ],
  limit_days: [
    { required: true, message: '请输入天数限制', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && (value < 1 || value > 30)) {
          callback(new Error('天数限制为1-30天'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  limit_space: [
    { required: true, message: '请输入空间限制', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && (value < 0.5 || value > 500)) {
          callback(new Error('空间限制为0.5-500GB'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 重置表单函数 - 必须在watch之前定义
const resetForm = () => {
  formData.value = {
    name: '',
    status: true,
    remark: '',
    limit_space: 10,
    limit_days: 7,
    over_step_plan: 'delFile' as any,
    plan_ranges: null
  }
  formRef.value?.clearValidate()
  recordPlanSelectorRef.value?.initPlan(null)
}

// 加载计划数据
const loadPlan = async (id: number) => {
  try {
    const response = await recordPlanApi.getDetail(id)
    if (response?.code === 0 && response.data) {
      const plan = response.data
      formData.value = {
        name: plan.name,
        status: plan.status,
        remark: plan.remark || '',
        limit_space: plan.limit_space,
        limit_days: plan.limit_days,
        over_step_plan: plan.over_step_plan,
        plan_ranges: plan.plan_ranges || null
      }
      recordPlanSelectorRef.value?.initPlan(JSON.stringify(plan.plan_ranges))
    }
  } catch (error: any) {
    console.error('Failed to load record plan:', error)
  }
}

// Watch for plan changes (edit mode)
watch(
  () => props.plan,
  (plan) => {
    if (plan) {
      loadPlan(plan.id)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      // 获取计划明细
      const planRanges = recordPlanSelectorRef.value?.getPlan()
      formData.value.plan_ranges = planRanges

      let response
      if (props.plan) {
        response = await recordPlanApi.update(props.plan.id, formData.value)
      } else {
        response = await recordPlanApi.create(formData.value)
      }

      if (response?.code === 0) {
        ElMessage.success(props.plan ? '更新成功' : '添加成功')
        emit('success')
        handleClose()
      } else {
        throw new Error(response?.message || '操作失败')
      }
    } catch (error: any) {
      console.error('Failed to submit form:', error)
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 0;
}

.form-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 8px;
}

:deep(.el-form-item__content) {
  display: flex;
  align-items: center;
}
</style>
