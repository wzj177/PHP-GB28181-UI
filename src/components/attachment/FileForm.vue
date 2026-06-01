<template>
  <ElDialog
    v-model="dialogVisible"
    title="上传附件"
    :width="width"
    :close-on-click-modal="false"
  >
    <ElForm ref="formRef" :model="model" label-width="100px">
      <ElFormItem label="上传方式:">
        <el-radio-group v-model="model.type">
          <el-radio-button label="local">本地上传</el-radio-button>
          <el-radio-button label="net">网络上传</el-radio-button>
        </el-radio-group>
      </ElFormItem>

      <ElFormItem label="上传分组:">
        <el-select
          v-model="model.group_code"
          clearable
          placeholder="请选择"
          @change="onChangeGroup"
          style="width: 100%"
        >
          <el-option
            v-for="item in catalogItems"
            :key="item.id"
            :label="item.tree_title || item.title"
            :value="item.code"
          />
        </el-select>
      </ElFormItem>

      <!-- 本地上传 -->
      <ElFormItem label="上传附件:" v-if="model.type === 'local'">
        <Uploader
          ref="uploaderRef"
          style-mode="drag"
          :group="model.group_code"
          :max-limit="3"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          :upload-tip="uploadTip"
          @success="onUploadSuccess"
          @error="onUploadError"
        />
      </ElFormItem>

      <!-- 网络上传 -->
      <ElFormItem label="网络资源:" v-if="model.type === 'net'">
        <NetworkUpload
          v-model="model.net_addr"
          :group="model.group_code"
          placeholder="请在此处粘贴资源地址"
          btn-text="提取资源"
          tips="大小不要超过10M,支持图片、音频、视频的常用格式"
          @ok="onNetworkUploadSuccess"
          @error="onNetworkUploadError"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div style="text-align: right">
        <el-button type="primary" @click="submitForm">提 交</el-button>
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { attachmentApi, type AttachmentCatalog, type AttachmentFile } from '@/api/attachmentApi'
import { Uploader, NetworkUpload } from '@/components/Uploader'

interface Props {
  width?: string
}

interface Emits {
  (e: 'ok', refreshFlag: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  width: '800px'
})

const emit = defineEmits<Emits>()

const formRef = ref()
const uploaderRef = ref<InstanceType<typeof Uploader>>()
const dialogVisible = ref(false)
const catalogItems = ref<AttachmentCatalog[]>([])
const fileIds = ref<number[]>([])

const defaultForm = {
  id: undefined,
  type: 'local',
  group_code: 'default',
  net_addr: ''
}

const model = reactive({ ...defaultForm })

const uploadTip = computed(() => {
  return '支持图片、音频、视频及常用文档格式，单个文件不超过10MB，最多上传3个文件'
})

// 获取目录树
const getCatalogTree = async () => {
  try {
    const trees = await attachmentApi.getCatalogTree({
      mode: 'list'
    })
    catalogItems.value = trees
  } catch (error) {
    console.error('Failed to get catalog tree:', error)
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(model, defaultForm)
  fileIds.value = []
  uploaderRef.value?.reset()
}

// 分组改变
const onChangeGroup = (value: string) => {
  // 更新上传组件的分组
  uploaderRef.value?.setGroup(value)
}

// 上传成功
const onUploadSuccess = (file: AttachmentFile) => {
  if (file.id) {
    ElMessage.success('上传成功')
    fileIds.value.push(file.id)
  }
}

// 上传失败
const onUploadError = (error: Error) => {
  ElMessage.error(error.message || '上传失败')
}

// 网络上传成功
const onNetworkUploadSuccess = (file: AttachmentFile) => {
  if (file.id) {
    ElMessage.success('提取成功')
    fileIds.value.push(file.id)
  }
}

// 网络上传失败
const onNetworkUploadError = (error: Error) => {
  ElMessage.error(error.message || '提取失败')
}

// 提交表单
const submitForm = async () => {
  if (model.type === 'net' && fileIds.value.length === 0) {
    ElMessage.warning('未进行提取操作，请输入资源地址后点击"提取资源"按钮提取')
    return
  }

  let refreshFlag = false

  if (fileIds.value.length > 0) {
    try {
      // 更新分组
      if (model.group_code) {
        await attachmentApi.moveGroup({
          ids: fileIds.value,
          groupCode: model.group_code
        })
      }

      refreshFlag = true
      ElMessage.success('保存成功')
    } catch (error) {
      console.error('Failed to submit form:', error)
      ElMessage.error('保存失败')
      return
    }
  }

  dialogVisible.value = false
  emit('ok', refreshFlag)
}

// 打开对话框
const open = () => {
  resetForm()
  getCatalogTree()
  dialogVisible.value = true
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
// FileForm styles - now using Uploader component
</style>
