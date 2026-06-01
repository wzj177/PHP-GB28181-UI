<template>
  <div :class="customClass">
    <el-input
      :placeholder="placeholder"
      v-model="inputValue"
      @input="onInput"
      clearable
    >
      <template #prepend>[http|https]://</template>
      <template #append>
        <el-button
          type="primary"
          class="net-btn"
          @click.stop="uploadRemoteFile"
          :loading="loading"
        >
          {{ btnText }}
          <el-icon class="el-icon--right"><Document /></el-icon>
        </el-button>
      </template>
    </el-input>
    <div class="el-upload__tip">{{ tips }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
// @ts-ignore - icon exists at runtime
import { Document } from '@element-plus/icons-vue'
import { attachmentApi, type AttachmentFile } from '@/api/attachmentApi'

/**
 * URL 验证正则
 */
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

/**
 * Props
 */
interface Props {
  modelValue?: string
  group?: string
  customClass?: string
  placeholder?: string
  tips?: string
  btnText?: string
  validateFunction?: (url: string) => { code: string; msg: string }
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  group: 'default',
  customClass: 'network-upload-wrapper',
  placeholder: '请在此处粘贴图片地址',
  tips: '需要[http|https]://.........大小不要超过10M,支持图片类型gif,jpg,png,jpeg',
  btnText: '提取图片'
})

/**
 * Emits
 */
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'ok', file: AttachmentFile): void
  (e: 'error', error: Error): void
}

const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/**
 * 验证 URL
 */
const validURL = (url: string): boolean => {
  return URL_REGEX.test(url)
}

/**
 * 输入事件
 */
const onInput = (value: string) => {
  emit('update:modelValue', value)
}

/**
 * 上传远程文件
 */
const uploadRemoteFile = async () => {
  if (!inputValue.value) {
    ElMessage.error('请输入资源地址')
    return
  }

  if (!validURL(inputValue.value)) {
    ElMessage.error('输入的资源地址有误')
    inputValue.value = ''
    return false
  }

  if (props.validateFunction) {
    const { code, msg } = props.validateFunction(inputValue.value)
    if (code !== 'ok') {
      ElMessage.error(msg)
      inputValue.value = ''
      return false
    }
  }

  loading.value = true

  try {
    const response = await attachmentApi.uploadRemoteFile({
      url: inputValue.value,
      group: props.group
    })

    ElNotification({
      title: '成功提示',
      dangerouslyUseHTMLString: true,
      message: '提取成功',
      type: 'success'
    })

    emit('ok', response.data)
    inputValue.value = ''
  } catch (error: any) {
    ElNotification({
      title: '失败提示',
      dangerouslyUseHTMLString: true,
      message: '提取失败，' + error.message,
      type: 'error'
    })
    emit('error', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.network-upload-wrapper {
  height: auto;
  width: 100%;
  margin: 0 auto;

  .el-upload__tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
  }
}

:deep(.el-input) {
  .el-input-group__append {
    cursor: pointer;
  }
}

:deep(.net-btn.el-button) {
  padding: 8px 15px !important;
  border-radius: 0 !important;
}
</style>
