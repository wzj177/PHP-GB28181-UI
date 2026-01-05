<template>
  <div class="el-attachment" :class="className">
    <!-- 预览插槽 -->
    <slot v-if="$slots.preview" name="preview"></slot>

    <!-- 文件预览 -->
    <div class="el-attachment-preview" v-else>
      <div class="el-attachment-preview-body">
        <!-- 已上传文件列表 -->
        <div class="el-attacment-preview-imgs" v-if="files.length">
          <div
            v-for="(item, index) in files"
            :key="index"
            class="el-attachment-preview-img"
            :class="{ hover: canAction(item) }"
            @mouseover="mouseOver(item)"
            @mouseout="mouseOut(item)"
            v-show="maxUpdCount === 0 || index <= maxUpdCount - 1"
          >
            <img :src="item.type === 'image' ? item.url : item.cover_full" :alt="item.filename" />
            <span class="el-attachment-preview-img-action">
              <span
                class="el-attachment-preview-img-action-preview"
                title="预览"
                @click="preview(item)"
              >
                <ElIcon :size="20"><Search /></ElIcon>
              </span>
              <span
                class="el-attachment-preview-img-action-edit"
                title="替换"
                @click="update(item)"
              >
                <ElIcon :size="20"><Edit /></ElIcon>
              </span>
              <span
                class="el-attachment-preview-img-action-delete"
                title="删除"
                @click="remove(item)"
              >
                <ElIcon :size="20"><Delete /></ElIcon>
              </span>
            </span>
          </div>
        </div>

        <!-- 上传按钮 -->
        <div
          v-if="maxUpdCount === 0 || files.length < maxUpdCount"
          class="el-attachment-preview-icon"
          @click="openDialog()"
        >
          <slot v-if="$slots.previewIcon" name="previewIcon"></slot>
          <ElIcon v-else :size="28" color="#8c939d"><Plus /></ElIcon>
        </div>
      </div>
    </div>

    <!-- 提示 -->
    <div v-if="tip" class="el-upload__tip el-attachment-tip">{{ tip }}</div>

    <!-- 选择对话框 -->
    <SelectorDialog
      ref="selectorRef"
      :file-type="fileType"
      :limit="maxUpdCount"
      @selected="onSelected"
    />

    <!-- 预览对话框 -->
    <ElDialog
      v-model="previewDialogVisible"
      title="预览"
      width="70%"
      append-to-body
    >
      <div class="preview-content">
        <ElImage
          v-if="previewFile?.type === 'image'"
          :src="previewFile?.url"
          fit="contain"
          style="width: 100%; max-height: 60vh"
        />
        <video
          v-else-if="previewFile?.type === 'video'"
          :src="previewFile?.url"
          controls
          style="width: 100%; max-height: 60vh"
        />
        <audio
          v-else-if="previewFile?.type === 'audio'"
          :src="previewFile?.url"
          controls
          style="width: 100%"
        />
        <ElEmpty v-else description="暂不支持该类型文件预览" />
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElIcon } from 'element-plus'
import { Search, Edit, Delete, Plus } from '@element-plus/icons-vue'
import SelectorDialog from './SelectorDialog.vue'
import type { AttachmentFile } from '@/api/attachmentApi'

interface Props {
  className?: string
  maxUpdCount?: number
  tip?: string
  fileType?: string
}

interface Emits {
  (e: 'success', files: AttachmentFile[]): void
  (e: 'remove', file: AttachmentFile): void
}

const props = withDefaults(defineProps<Props>(), {
  maxUpdCount: 1,
  tip: '',
  fileType: 'image'
})

const emit = defineEmits<Emits>()

const files = ref<AttachmentFile[]>([])
const showOptFiles = ref<AttachmentFile[]>([])
const previewDialogVisible = ref(false)
const previewFile = ref<AttachmentFile | null>(null)
const selectorRef = ref<InstanceType<typeof SelectorDialog>>()

// 是否能操作
const canAction = (file: AttachmentFile) => {
  if (!showOptFiles.value.length) {
    return false
  }

  if ('id' in file) {
    return showOptFiles.value.some(item => item.id === file.id)
  }

  return showOptFiles.value.some(item => item.url === file.url)
}

// 鼠标移入
const mouseOver = (file: AttachmentFile) => {
  if (!canAction(file)) {
    showOptFiles.value.push(file)
  }
}

// 鼠标移出
const mouseOut = (file: AttachmentFile) => {
  showOptFiles.value = showOptFiles.value.filter(item => {
    if ('id' in item) {
      return item.id !== file.id
    }
    return item.url !== file.url
  })
}

// 预览
const preview = (file: AttachmentFile) => {
  previewFile.value = file
  previewDialogVisible.value = true
}

// 替换
const update = (file: AttachmentFile) => {
  openDialog(file)
}

// 删除
const remove = (file: AttachmentFile) => {
  files.value = files.value.filter(item => {
    if ('id' in item && 'id' in file) {
      return item.id !== file.id
    }
    return item.url !== file.url
  })
  emit('remove', file)
}

// 打开对话框
const openDialog = (file?: AttachmentFile) => {
  selectorRef.value?.open(file)
}

// 选中回调
const onSelected = (selectedFiles: AttachmentFile[]) => {
  files.value = selectedFiles
  emit('success', selectedFiles)
}

// 初始化
const init = (fileList: AttachmentFile[]) => {
  files.value = fileList
}

defineExpose({
  init
})
</script>

<style lang="scss" scoped>
.el-attachment {
  .el-attachment-preview {
    cursor: pointer;

    .el-attachment-preview-body {
      &::after {
        content: '';
        display: table;
        clear: both;
      }

      .el-attacment-preview-imgs {
        display: inline-block;

        .el-attachment-preview-img {
          position: relative;
          display: inline-block;
          text-align: center;
          background-color: #fbfdff;
          border: 1px dashed #c0ccda;
          border-radius: 6px;
          box-sizing: border-box;
          width: 148px;
          height: 148px;
          line-height: 146px;
          vertical-align: top;
          margin-left: 4px;

          &:first-child {
            margin-left: 0;
          }

          &.hover {
            background-color: rgba(0, 0, 0, 0.2);
            box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6),
              0 2px 4px 0 rgba(232, 237, 250, 0.5);

            .el-attachment-preview-img-action {
              opacity: 1;

              span {
                display: inline;
              }
            }
          }

          .el-attachment-preview-img-action {
            display: inline-block;
            position: absolute;
            width: 100%;
            height: 100%;
            left: 0;
            top: 0;
            cursor: default;
            text-align: center;
            color: #fff;
            opacity: 0;
            font-size: 20px;
            background-color: rgba(0, 0, 0, 0.5);
            transition: opacity 0.3s;

            span {
              display: none;
              cursor: pointer;
            }
          }

          img {
            width: 100%;
            height: 100%;
            display: inline-block;
            vertical-align: top;
          }
        }
      }

      .el-attachment-preview-icon {
        margin-left: 4px;
        display: inline-block;
        position: relative;
        text-align: center;
        background-color: #fbfdff;
        border: 1px dashed #c0ccda;
        border-radius: 6px;
        box-sizing: border-box;
        width: 148px;
        height: 148px;
        line-height: 146px;
        vertical-align: top;
        cursor: pointer;

        &:hover {
          border-color: #409eff;
          color: #409eff;
        }
      }
    }
  }

  .el-attachment-tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-top: 8px;
  }
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
