<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    :width="412"
    :close-on-click-modal="false"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="right"
      label-width="83px"
      size="default"
    >
      <ElFormItem label="分组名称:" prop="title">
        <ElInput v-model="formData.title" placeholder="请输入分组名称" />
      </ElFormItem>

      <ElFormItem label="分组编码:" prop="code">
        <ElInput
          v-model="formData.code"
          placeholder="非必填,不可填写重复"
          :disabled="dialogType === 'edit' && formData.code !== ''"
        />
      </ElFormItem>

      <ElFormItem label="上级分组:" prop="parent_id">
        <ElSelect
          v-model="formData.parent_id"
          clearable
          placeholder="请选择"
          style="width: 100%"
        >
          <ElOption :value="0" label="请选择上级分组" />
          <ElOption
            v-for="item in catalogOptions"
            :key="item.id"
            :label="item.tree_title"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="系统默认:" prop="is_default">
        <ElRadioGroup v-model="formData.is_default">
          <ElRadio :label="1">是</ElRadio>
          <ElRadio :label="0">否</ElRadio>
        </ElRadioGroup>
        <div class="el-upload__tip">系统默认分组无法删除、修改</div>
      </ElFormItem>

      <ElFormItem label="排序:">
        <ElInputNumber
          v-model="formData.sort"
          controls-position="right"
          :min="1"
          :max="1000"
          style="width: 279px"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div style="text-align: right">
        <ElButton type="primary" @click="submitForm">提交</ElButton>
        <ElButton type="danger" @click="dialogVisible = false">取消</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { attachmentApi, type CatalogFormData, type AttachmentCatalog } from '@/api/attachmentApi'

interface Emits {
  (e: 'ok'): void
}

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const catalogOptions = ref<AttachmentCatalog[]>([])

const defaultForm: CatalogFormData = {
  title: '',
  code: '',
  parent_id: 0,
  is_default: 0,
  sort: 50
}

const formData = ref<CatalogFormData>({ ...defaultForm })

const rules: FormRules = {
  title: [
    { required: true, message: '请输入分组名称', trigger: 'blur' }
  ]
}

const title = computed(() => {
  return dialogType.value === 'edit' ? '编辑分组' : '新增分组'
})

// 获取目录树选项
const getCatalogTree = async () => {
  try {
    const trees = await attachmentApi.getCatalogTree({
      mode: 'list',
      level_le: 1
    })
    catalogOptions.value = trees
  } catch (error) {
    console.error('Failed to get catalog tree:', error)
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        if (dialogType.value === 'edit') {
          await attachmentApi.editCatalog(formData.value.id!, formData.value)
          ElMessage.success('更新成功')
        } else {
          await attachmentApi.addCatalog(formData.value)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        emit('ok')
      } catch (error) {
        console.error('Failed to submit form:', error)
      }
    }
  })
}

// 打开对话框
const open = (type: 'add' | 'edit', data?: CatalogFormData) => {
  dialogType.value = type
  dialogVisible.value = true

  if (type === 'edit' && data) {
    formData.value = { ...data }
  } else {
    formData.value = { ...defaultForm }
  }

  getCatalogTree()

  // Reset form validation
  formRef.value?.clearValidate()
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  .el-input__inner {
    width: 279px;
  }
}

:deep(.el-input-number) {
  width: 279px !important;
}

:deep(.el-form-item__label) {
  width: 83px;
}

.el-form {
  margin-bottom: 20px;
}

.el-upload__tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 4px;
}
</style>
