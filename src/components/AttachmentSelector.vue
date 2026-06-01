<template>
  <div class="attachment-selector">
    <ElInput
      v-model="inputValue"
      placeholder="请选择或输入附件URL"
      readonly
      @click="openDialog"
    >
      <template #append>
        <ElButton @click="openDialog">选择</ElButton>
      </template>
    </ElInput>
    <div v-if="previewUrl" class="attachment-preview">
      <ElImage
        v-if="isImage"
        :src="previewUrl"
        fit="contain"
        style="max-height: 100px; max-width: 200px;"
        :preview-src-list="[previewUrl]"
      />
      <ElLink
        v-else
        :href="previewUrl"
        target="_blank"
        type="primary"
        :underline="false"
      >
        📄
      </ElLink>
    </div>

    <!-- Attachment selection dialog -->
    <ElDialog
      v-model="dialogVisible"
      title="选择附件"
      width="900px"
      append-to-body
    >
      <AttachmentSelectList
        v-model="selectedAttachment"
        :type="fileType"
        @confirm="handleSelect"
      />
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
// import { Document } from '@element-plus/icons-vue'
import AttachmentSelectList from './AttachmentSelectList.vue'
import type { AttachmentType } from '@/types/attachment'

interface Props {
  modelValue: string
  type?: AttachmentType
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'image'
})

const emit = defineEmits<Emits>()

const inputValue = ref(props.modelValue)
const dialogVisible = ref(false)
const selectedAttachment = ref<string | null>(props.modelValue)

// Watch for modelValue changes
watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal
  selectedAttachment.value = newVal
})

const fileType = computed(() => props.type)

const previewUrl = computed(() => props.modelValue)

const isImage = computed(() => {
  if (!props.modelValue) return false
  const ext = props.modelValue.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')
})

const openDialog = () => {
  dialogVisible.value = true
}

const handleSelect = (url: string) => {
  emit('update:modelValue', url)
  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
.attachment-selector {
  .attachment-preview {
    margin-top: 8px;
    display: flex;
    align-items: center;
    padding: 8px;
    background: var(--bg-page);
    border-radius: 4px;
    min-height: 60px;
  }
}
</style>
