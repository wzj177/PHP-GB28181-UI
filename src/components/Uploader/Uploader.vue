<template>
  <div class="uploader-wrapper">
    <!-- 按钮单文件上传 -->
    <el-upload
      v-if="styleMode === 'btn'"
      ref="uploadRef"
      :show-file-list="false"
      :auto-upload="autoUpload"
      :on-change="onChange"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :accept="accept"
    >
      <el-button type="primary" :icon="Plus">点击上传</el-button>
      <template #tip>
        <div class="upload-tip">
          <span>上传限制说明</span>
          <el-tooltip :content="showUploadTip" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
    </el-upload>

    <!-- 头像单文件上传 -->
    <el-upload
      v-if="styleMode === 'avatar'"
      ref="uploadRef"
      :show-file-list="false"
      :auto-upload="autoUpload"
      :on-change="onChange"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-progress="onProcess"
      :on-success="onSuccess"
      :accept="accept"
    >
      <img v-if="showImgUrl" :src="showImgUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      <template #tip v-if="showUploadTip">
        <div class="el-upload__tip">{{ showUploadTip }}</div>
      </template>
    </el-upload>

    <!-- 图片多文件上传 -->
    <el-upload
      v-if="styleMode === 'pictures'"
      ref="uploadRef"
      list-type="picture-card"
      :auto-upload="autoUpload"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-change="onChange"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :on-remove="onRemove"
      :file-list="fileList"
      :limit="maxLimit"
      :accept="accept"
    >
      <el-icon v-if="canUpload"><Plus /></el-icon>
      <template #file="{ file }">
        <div>
          <!-- @ts-expect-error file.url type issue -->
          <img class="el-upload-list__item-thumbnail" :src="file.url as any" alt="" />
          <span class="el-upload-list__item-actions">
            <span class="el-upload-list__item-preview" @click="handlePictureCardPreview(file)">
              <el-icon><ZoomIn /></el-icon>
            </span>
            <span class="el-upload-list__item-delete" @click="handleRemove(file)">
              <el-icon><Delete /></el-icon>
            </span>
          </span>
        </div>
      </template>
      <template #tip v-if="showUploadTip">
        <div class="el-upload__tip">{{ showUploadTip }}</div>
      </template>
    </el-upload>

    <!-- 拖拽多文件上传 -->
    <el-upload
      v-if="styleMode === 'drag'"
      ref="uploadRef"
      drag
      :show-file-list="true"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-exceed="onExceed"
      :on-remove="onRemove"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :on-change="onChange"
      :file-list="fileList"
      :multiple="multiple"
      :limit="maxLimit"
      :accept="accept"
    >
      <el-icon v-if="canUpload" class="el-icon--upload"><Document /></el-icon>
      <div v-if="canUpload" class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip v-if="showUploadTip">
        <div class="el-upload__tip">{{ showUploadTip }}</div>
      </template>
    </el-upload>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" append-to-body title="图片预览">
      <!-- @vue-ignore -->
      <img width="100%" :src="previewImageSrc" alt="" />
    </el-dialog>

    <!-- 图片裁剪弹窗 -->
    <el-dialog
      v-if="cropImg"
      v-model="cropDialogVisible"
      title="图片裁剪"
      width="960px"
      append-to-body
      @open="onOpenCropDialog"
    >
      <div class="cropper-content">
        <div class="cropper-box">
          <div class="cropper">
            <Cropper
              ref="cropperRef"
              :src="cropper.img"
              :stencil-props="cropper.stencilProps"
              :canvas="cropper.canvas"
              @change="cropRealTime"
            />
          </div>
        </div>
        <div class="show-preview">
          <div :style="cropPreviews.div" class="preview">
            <img :src="cropPreviews.url" :style="cropPreviews.img" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="cropDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="finishCropper" :loading="cropperLoading">
          确 认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElNotification, type UploadProps, type UploadFile, type UploadUserFile } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
// @ts-ignore
import { ZoomIn } from '@element-plus/icons-vue'
// @ts-ignore
import { QuestionFilled } from '@element-plus/icons-vue'
// @ts-ignore
import { Document } from '@element-plus/icons-vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { attachmentApi, type AttachmentFile } from '@/api/attachmentApi'
import HashWorker from './workers/hash.worker?worker'

/**
 * 附件配置接口
 */
interface AttachmentConfig {
  allow_image_exts: string[]
  allow_audio_exts: string[]
  allow_video_exts: string[]
  allow_file_exts: string[]
  allow_image_upload_size: number
  allow_audio_upload_size: number
  allow_video_upload_size: number
  allow_file_upload_size: number
  max_package_size: number
  allow_snippet_upload: boolean
}

/**
 * Props 定义
 */
interface Props {
  autoUpload?: boolean
  styleMode?: 'btn' | 'avatar' | 'pictures' | 'drag'
  imageUrl?: string
  maxLimit?: number
  accept?: string
  uploadTip?: string
  cropImg?: boolean
  cropImgSize?: number[]
  cropFixedNumber?: number[]
  group?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoUpload: true,
  styleMode: 'drag',
  imageUrl: '',
  maxLimit: 0,
  accept: '',
  uploadTip: '',
  cropImg: false,
  cropImgSize: () => [],
  cropFixedNumber: () => [],
  group: 'default'
})

/**
 * Emits 定义
 */
interface Emits {
  (e: 'success', file: AttachmentFile, uploadFile: UploadFile, fileList: UploadUserFile[]): void
  (e: 'error', error: Error, file: UploadFile, fileList: UploadUserFile[]): void
}

const emit = defineEmits<Emits>()

// Refs
const uploadRef = ref()
const cropperRef = ref()

// State
const showUploadTip = ref('')
const previewImageSrc = ref<string>('')
const previewVisible = ref(false)
const innerGroup = ref(props.group)
const fileList = ref<UploadUserFile[]>([])
const chooseFileCount = ref(0)
const fileInfo = ref<any>(null)
const attachmentConfig = ref<AttachmentConfig | null>(null)
const showImgUrl = ref(props.imageUrl)
const multiple = ref(true)
const cropper = reactive({
  img: '',
  canvas: false,
  stencilProps: {
    aspectRatio: 1
  }
})
const cropperLoading = ref(false)
const cropDialogVisible = ref(false)
const cropPreviews = reactive({
  url: '',
  div: {} as any,
  img: {} as any
})

// Computed
const canUpload = computed(() => {
  return props.maxLimit > 0 && chooseFileCount.value <= props.maxLimit
})

/**
 * 获取系统附件配置
 */
const getAttachmentConfig = async () => {
  try {
    const res = await attachmentApi.config()
    attachmentConfig.value = res.data
    setUploadTipBySysConfig()
  } catch (error) {
    console.error('Failed to get attachment config:', error)
  }
}

/**
 * 根据系统配置设置上传提示
 */
const setUploadTipBySysConfig = () => {
  if (props.uploadTip) {
    showUploadTip.value = props.uploadTip
    return
  }

  if (!attachmentConfig.value) {
    return
  }

  let allowExts: string[] = []

  if (props.accept.indexOf('image/') >= 0) {
    allowExts = attachmentConfig.value.allow_image_exts
    const extStr = allowExts.join('、')
    const imgMaxSize = (attachmentConfig.value.allow_image_upload_size / 1024).toFixed(2) + 'MB'
    showUploadTip.value = `只能上传${extStr}文件，且图片大小不超过${imgMaxSize}`
  } else if (props.accept.indexOf('audio/') >= 0) {
    allowExts = attachmentConfig.value.allow_audio_exts
    const extStr = allowExts.join('、')
    const audioMaxSize = (attachmentConfig.value.allow_audio_upload_size / 1024).toFixed(2) + 'MB'
    showUploadTip.value = `只能上传${extStr}文件，且音频大小不超过${audioMaxSize}`
  } else if (props.accept.indexOf('video/') >= 0) {
    allowExts = attachmentConfig.value.allow_video_exts
    const extStr = allowExts.join('、')
    const videoMaxSize = (attachmentConfig.value.allow_video_upload_size / 1024).toFixed(2) + 'MB'
    showUploadTip.value = `只能上传${extStr}文件，且视频大小不超过${videoMaxSize}`
  } else {
    allowExts = [
      ...attachmentConfig.value.allow_image_exts,
      ...attachmentConfig.value.allow_audio_exts,
      ...attachmentConfig.value.allow_video_exts,
      ...attachmentConfig.value.allow_file_exts
    ]
    const extStr = allowExts.join('、')
    const imgMaxSize = (attachmentConfig.value.allow_image_upload_size / 1024).toFixed(2) + 'MB'
    const audioMaxSize = (attachmentConfig.value.allow_audio_upload_size / 1024).toFixed(2) + 'MB'
    const videoMaxSize = (attachmentConfig.value.allow_video_upload_size / 1024).toFixed(2) + 'MB'
    const otherFileMaxSize = (attachmentConfig.value.allow_file_upload_size / 1024).toFixed(2) + 'MB'

    showUploadTip.value = `只能上传${extStr}文件，且图片大小不超过${imgMaxSize}、视频大小不超过${videoMaxSize}、音频大小不超过${audioMaxSize}、其它类型文件不超过${otherFileMaxSize}`
  }
}

/**
 * 检查文件是否使用普通上传
 */
const checkFileIsUseNormalUpload = (fileSize: number) => {
  if (!attachmentConfig.value) {
    return true
  }

  const allowChunkUpload = attachmentConfig.value.allow_snippet_upload ?? true

  return fileSize < attachmentConfig.value.max_package_size || !allowChunkUpload
}

/**
 * 上传前校验
 */
const onBeforeUpload = (file: File) => {
  if (!attachmentConfig.value) {
    return false
  }

  const fa = file.name.split('.')
  const ext = fa[fa.length - 1].toLowerCase()

  if (file.type.indexOf('image/') >= 0) {
    return validateFile(
      'image',
      ext,
      file.size,
      attachmentConfig.value.allow_image_exts,
      attachmentConfig.value.allow_image_upload_size
    )
  }

  if (file.type.indexOf('audio/') >= 0) {
    return validateFile(
      'audio',
      ext,
      file.size,
      attachmentConfig.value.allow_audio_exts,
      attachmentConfig.value.allow_audio_upload_size
    )
  }

  if (file.type.indexOf('video/') >= 0) {
    return validateFile(
      'video',
      ext,
      file.size,
      attachmentConfig.value.allow_video_exts,
      attachmentConfig.value.allow_video_upload_size
    )
  }

  return validateFile(
    'other',
    ext,
    file.size,
    attachmentConfig.value.allow_file_exts,
    attachmentConfig.value.allow_file_upload_size
  )
}

/**
 * 文件校验
 */
const validateFile = (
  fileType: string,
  ext: string,
  fileSize: number,
  allowExts: string[],
  allowSize: number
) => {
  let fileTypeText = '其它类型文件'
  if (fileType === 'image') {
    fileTypeText = '图片'
  } else if (fileType === 'audio') {
    fileTypeText = '音频'
  } else if (fileType === 'video') {
    fileTypeText = '视频'
  }

  if (!allowExts.includes(ext)) {
    const exts = allowExts.join('、')
    ElMessage.error(`上传失败，${fileTypeText}只能是 ${exts} 格式!`)
    return false
  }

  if (checkFileIsUseNormalUpload(fileSize) && fileSize > allowSize * 1024) {
    const maxSize = (allowSize / 1024).toFixed(2) + 'MB'
    ElMessage.error(`上传失败，${fileTypeText}大小不能超过${maxSize}!`)
    return false
  }

  return true
}

/**
 * 文件状态改变
 */
const onChange: UploadProps['onChange'] = (file, uploadFileList) => {
  chooseFileCount.value = uploadFileList.length

  if (props.maxLimit > 0 && chooseFileCount.value > props.maxLimit) {
    ElMessage.warning(`上传失败，最多允许上传${props.maxLimit}个文件`)
    fileList.value = uploadFileList.slice(-props.maxLimit)
    uploadRef.value?.clearFiles()
    return false
  }

  if (!props.autoUpload && props.cropImg) {
    openCropDialog(file)
  }
}

/**
 * 超出限制
 */
const onExceed: UploadProps['onExceed'] = (files, fileList) => {
  if (props.maxLimit > 0) {
    ElMessage.warning(
      `当前限制选择 ${props.maxLimit} 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`
    )
  }
}

/**
 * 预览
 */
const onPreview: UploadProps['onPreview'] = (file) => {
  // console.log('preview:', file)
}

/**
 * 上传进度
 */
const onProcess: UploadProps['onProgress'] = (event, file, fileList) => {
  // console.log('process:', event, file)
}

/**
 * 上传成功
 */
const onSuccess: UploadProps['onSuccess'] = (response, file, fileList) => {
  ElNotification({
    title: '成功提示',
    dangerouslyUseHTMLString: true,
    message: '上传成功',
    type: 'success'
  })

  if (['avatar', 'btn'].includes(props.styleMode)) {
    uploadRef.value?.clearFiles()
  }

  showImgUrl.value = response.cover

  if (props.cropImg && cropDialogVisible.value) {
    cropDialogVisible.value = false
    cropper.img = ''
  }

  emit('success', response, file, fileList)
}

/**
 * 上传失败
 */
const onError = (error: Error, file: UploadFile, fileList: UploadFile[]) => {
  ElNotification({
    title: '失败提示',
    dangerouslyUseHTMLString: true,
    message: '上传失败:' + error.message,
    type: 'error'
  })
  emit('error', error, file, fileList)
}

/**
 * 移除文件
 */
const onRemove: UploadProps['onRemove'] = async (file, fileList) => {
  if ((file.response as any)?.fileId) {
    try {
      await attachmentApi.delete((file.response as any).fileId)
      ElMessage.success('成功移除' + file.name)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}

/**
 * 图片预览
 */
const handlePictureCardPreview = (file: UploadFile) => {
  previewImageSrc.value = (file.url as string) || ''
  previewVisible.value = true
}

/**
 * 移除文件（手动）
 */
const handleRemove = async (file: UploadFile) => {
  uploadRef.value?.handleRemove(file)
  if ((file.response as any)?.fileId) {
    try {
      await attachmentApi.delete((file.response as any).fileId)
      ElMessage.success('成功移除' + file.name)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}

/**
 * 打开裁剪弹窗
 */
const openCropDialog = (file: UploadFile) => {
  if (props.cropImgSize.length === 2) {
    cropper.stencilProps = {
      ...cropper.stencilProps,
      aspectRatio: props.cropImgSize[0] / props.cropImgSize[1]
    }
  }

  if (props.cropFixedNumber.length === 2) {
    cropper.stencilProps = {
      ...cropper.stencilProps,
      aspectRatio: props.cropFixedNumber[0] / props.cropFixedNumber[1]
    }
  }

  cropper.img = URL.createObjectURL(file.raw as File)
  cropDialogVisible.value = true
}

/**
 * 裁剪实时预览
 */
const cropRealTime = (data: any) => {
  // console.log('crop real time:', data)
}

/**
 * 裁剪弹窗打开
 */
const onOpenCropDialog = () => {
  // console.log('open crop dialog')
}

/**
 * 完成裁剪
 */
const finishCropper = async () => {
  if (!cropperRef.value) {
    return
  }

  cropperLoading.value = true

  try {
    const { canvas } = cropperRef.value.getResult()
    canvas.toBlob(async (blob: Blob | null) => {
      if (!blob) {
        cropperLoading.value = false
        return
      }

      const file = new File([blob], 'file.jpg', { type: 'image/jpeg' })
      uploadFile(file)
      cropperLoading.value = false
      cropDialogVisible.value = false
      cropper.img = ''
    }, 'image/jpeg')
  } catch (error) {
    console.error('Crop error:', error)
    cropperLoading.value = false
  }
}

/**
 * 自定义上传
 */
// @ts-expect-error
const customUpload: UploadProps['httpRequest'] = (options) => {
  const file = options.file as File
  uploadFile(file, options as any)
}

/**
 * 分片大小
 */
const CHUNK_SIZE = 5 * 1024 * 1024

/**
 * 上传文件
 */
const uploadFile = async (file: File, options?: any) => {
  if (checkFileIsUseNormalUpload(file.size)) {
    // 普通上传
    sendFile(file, options, (progressEvent) => {
      const num = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
      if (options?.onProgress) {
        options.onProgress({ percent: num })
      }
    })
    return
  }

  // 分片上传
  ElNotification({
    title: '提示',
    dangerouslyUseHTMLString: true,
    message: '文件正在进行分片上传，请耐心等待',
    type: 'info'
  })

  try {
    const fileMd5 = await createFileMd5(file)
    // 查询已上传的分片
    const data = await attachmentApi.checkSnippet(fileMd5)
    const uploaded = data.data?.length ? data.data.map((m: string) => parseInt(m.split('-')[1])) : []

    // 切割文件
    const chunkItems = await cutBlob(fileMd5, file, uploaded)

    // 开始上传
    fileInfo.value = {
      hash: fileMd5,
      total: Math.ceil(file.size / CHUNK_SIZE),
      name: file.name,
      raw: file,
      size: file.size
    }

    sendRequest(chunkItems, 5, chunkMerge, options)
  } catch (error) {
    console.error('Chunk upload error:', error)
    onError(error as Error, {} as UploadFile, [])
  }
}

/**
 * 创建文件 MD5
 */
const createFileMd5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new HashWorker()
    worker.postMessage({ file, chunkSize: CHUNK_SIZE })
    worker.onmessage = (event) => {
      resolve(event.data)
    }
    worker.onerror = (error) => {
      reject(error)
    }
  })
}

/**
 * 文件分割
 */
const cutBlob = (fileHash: string, file: File, uploaded: number[]) => {
  const chunkList: Array<{ index: number; chunk: Blob }> = []
  const blobSlice =
    File.prototype.slice ||
    // @ts-ignore
    File.prototype.mozSlice ||
    // @ts-ignore
    File.prototype.webkitSlice
  const chunkNum = Math.ceil(file.size / CHUNK_SIZE)

  for (let i = 0; i < chunkNum; i++) {
    // 如果已经上传则跳过
    if (uploaded.includes(i)) {
      continue
    }

    const startIndex = i * CHUNK_SIZE
    const endIndex = Math.min((i + 1) * CHUNK_SIZE, file.size)

    const contentItem = blobSlice.call(file, startIndex, endIndex)
    chunkList.push({
      index: i,
      chunk: contentItem
    })
  }

  return chunkList
}

/**
 * 发送分片请求
 */
const sendRequest = (
  chunkItems: Array<{ index: number; chunk: Blob }>,
  max: number,
  callback: () => void,
  options?: any
) => {
  const fetchArr: Promise<any>[] = []

  const toFetch = () => {
    if (!chunkItems.length) {
      return Promise.resolve()
    }

    const chunkItem = chunkItems.shift()!
    const currentNum = chunkItem.index + 1
    const it = sendChunk(chunkItem)

    it.then(
      () => {
        fetchArr.splice(fetchArr.indexOf(it), 1)
      },
      (err) => {
        chunkItems.unshift(chunkItem)
        console.error('send request error:', err)
      }
    )

    fetchArr.push(it)
    let p = Promise.resolve()

    if (fetchArr.length >= max) {
      p = Promise.race(fetchArr)
    }

    if (options?.onProgress) {
      const snippetPercent = Math.round((currentNum / fileInfo.value.total) * 100 * 100) / 100
      options.onProgress({ percent: snippetPercent * 0.95 })
    }

    return p.then(() => toFetch())
  }

  toFetch().then(() => {
    Promise.all(fetchArr).then(
      () => {
        callback()
      },
      (error) => {
        console.error('to fetch error:', error)
      }
    )
  })
}

/**
 * 发送分片
 */
const sendChunk = (item: { index: number; chunk: Blob }) => {
  const formData = new FormData()
  formData.append('file', item.chunk)
  formData.append('index', item.index.toString())
  formData.append('hash', fileInfo.value.hash)
  formData.append('filename', fileInfo.value.name)

  return attachmentApi.uploadSnippet(formData)
}

/**
 * 发送文件
 */
const sendFile = (
  file: File,
  options: any,
  onUploadProgress?: (progressEvent: any) => void
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('group', innerGroup.value)

  attachmentApi
    .uploadFile(formData, onUploadProgress)
    .then((response) => {
      if (options?.onSuccess) {
        options.onSuccess(response.data, file, fileList.value)
      }
    })
    .catch((error) => {
      if (options?.onError) {
        options.onError(error, file, fileList.value)
      }
    })
}

/**
 * 合并分片
 */
const chunkMerge = () => {
  ElNotification({
    title: '提示',
    dangerouslyUseHTMLString: true,
    message: '开始合并分片，请耐心等待',
    type: 'info'
  })

  fileInfo.value.group = innerGroup.value

  return attachmentApi
    .mergeSnippetFile(fileInfo.value)
    .then((response) => {
      const fileObj = fileList.value.find((f) => f.name === fileInfo.value.name)
      if (fileObj) {
        const editableFile = fileObj as any
        editableFile.percentage = 100
        editableFile.status = 'success'
        editableFile.response = response.data
        editableFile.url = response.data.cover
        // @ts-expect-error
        onSuccess(response.data, fileObj, fileList.value)
      }
    })
    .catch((err) => {
      const fileObj = fileList.value.find((f) => f.name === fileInfo.value.name)
      if (fileObj) {
        const editableFile = fileObj as any
        editableFile.status = 'fail'
        fileList.value.splice(fileList.value.indexOf(fileObj), 1)
        // @ts-expect-error
        onError(err, fileObj, fileList.value)
      }
    })
}

/**
 * 初始化
 */
const init = (options: any) => {
  if (options.showImgUrl !== undefined) {
    showImgUrl.value = options.showImgUrl
  }
}

/**
 * 设置分组
 */
const setGroup = (group: string) => {
  innerGroup.value = group || 'default'
}

/**
 * 重置
 */
const reset = () => {
  showImgUrl.value = ''
  fileInfo.value = null
  fileList.value = []
  innerGroup.value = props.group
  previewVisible.value = false
  uploadRef.value?.clearFiles()
}

// Watch
watch(
  () => props.imageUrl,
  (newVal) => {
    showImgUrl.value = newVal
  }
)

watch(
  () => props.group,
  (newVal) => {
    innerGroup.value = newVal
  }
)

// Lifecycle
onMounted(() => {
  getAttachmentConfig()
})

// Expose
defineExpose({
  init,
  setGroup,
  reset
})
</script>

<style lang="scss" scoped>
.uploader-wrapper {
  // 按钮上传风格
  .upload-tip {
    padding-left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  // 头像上传风格
  :deep(.avatar-uploader-icon),
  :deep(.avatar) {
    width: 178px;
    height: 178px;
    display: block;
  }

  :deep(.avatar-uploader-icon) {
    font-size: 28px;
    color: #8c939d;
    text-align: center;
    line-height: 178px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      border-color: #409eff;
    }
  }

  // 多图片上传风格
  :deep(.el-upload-list--picture-card) {
    .el-upload-list__item {
      div:first-child {
        width: 100%;
        height: 100%;
      }
    }
  }

  // 拖拽上传风格
  :deep(.el-upload-list) {
    width: 360px;
  }

  :deep(.el-upload__tip) {
    width: 360px;
  }
}

// 图片预览样式
:deep(.el-upload-list__item-thumbnail) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// 裁剪样式
.cropper-content {
  display: flex;
  justify-content: flex-end;

  .cropper-box {
    flex: 1;
    width: 100%;

    .cropper {
      width: auto;
      height: 400px;
    }
  }

  .show-preview {
    flex: 1;
    display: flex;
    justify-content: center;

    .preview {
      overflow: hidden;
      border: 1px solid #67c23a;
      background: #cccccc;
    }
  }
}
</style>
