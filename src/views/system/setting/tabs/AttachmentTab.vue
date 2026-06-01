<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="图片类型：" prop="allow_image_exts">
      <el-checkbox-group v-model="formData.allow_image_exts">
        <el-checkbox
          v-for="item in imageTypeOptions"
          :key="item.value"
          :label="item.value"
        >
          {{ item.name }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="图片大小限制：" prop="allow_image_upload_size">
      <el-input
        v-model.number="formData.allow_image_upload_size"
        type="number"
        style="width: 200px"
      >
        <template #append>KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 10240KB</div>
    </el-form-item>
    <el-form-item label="是否开启图片裁剪：" prop="allow_image_clip">
      <el-radio v-model="formData.allow_image_clip" :label="1">开启</el-radio>
      <el-radio v-model="formData.allow_image_clip" :label="0">关闭</el-radio>
    </el-form-item>
    <el-form-item label="图片裁剪尺寸：" prop="image_clip_size_type">
      <el-checkbox-group v-model="formData.image_clip_size_type">
        <el-checkbox
          v-for="item in clipTypeOptions"
          :key="item.value"
          :label="item.value"
        >
          {{ item.name }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="音频类型：" prop="allow_audio_exts">
      <el-checkbox-group v-model="formData.allow_audio_exts">
        <el-checkbox
          v-for="item in audioTypeOptions"
          :key="item.value"
          :label="item.value"
        >
          {{ item.name }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="音频大小限制：" prop="allow_audio_upload_size">
      <el-input
        v-model.number="formData.allow_audio_upload_size"
        type="number"
        style="width: 200px"
      >
        <template #append>KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 10240KB</div>
    </el-form-item>
    <el-form-item label="视频类型：" prop="allow_video_exts">
      <el-checkbox-group v-model="formData.allow_video_exts">
        <el-checkbox
          v-for="item in videoTypeOptions"
          :key="item.value"
          :label="item.value"
        >
          {{ item.name }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="视频大小限制：" prop="allow_video_upload_size">
      <el-input
        v-model.number="formData.allow_video_upload_size"
        type="number"
        style="width: 200px"
      >
        <template #append>KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 20480KB</div>
    </el-form-item>
    <el-form-item label="是否开启视频格式转化：" prop="allow_transcode_video">
      <el-radio v-model="formData.allow_transcode_video" :label="1">开启</el-radio>
      <el-radio v-model="formData.allow_transcode_video" :label="0">关闭</el-radio>
      <div class="el-upload__tip">默认将非 mp4 视频，转 mp4</div>
    </el-form-item>
    <el-form-item label="其它文件类型：" prop="allow_file_exts">
      <el-input v-model="formData.allow_file_exts">
        <template #append>文件后缀名</template>
      </el-input>
      <div class="el-upload__tip">多个以英文"|"隔开</div>
    </el-form-item>
    <el-form-item label="其它文件大小限制：" prop="allow_file_upload_size">
      <el-input
        v-model.number="formData.allow_file_upload_size"
        type="number"
        style="width: 200px"
      >
        <template #append>KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 10240KB</div>
    </el-form-item>
    <el-form-item label="是否开启分片上传：" prop="allow_snippet_upload">
      <el-radio v-model="formData.allow_snippet_upload" :label="1">开启</el-radio>
      <el-radio v-model="formData.allow_snippet_upload" :label="0">关闭</el-radio>
      <div class="el-upload__tip">只有当当文件超过webman server max_package_size 配置时，才会进行分片</div>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { systemApi, type AttachmentSetting, type AttachmentOptions } from '@/api/systemApi'

interface Option {
  value: string
  name: string
}

const formRef = ref<FormInstance>()
const loading = ref(false)

const defaultForm: AttachmentSetting = {
  allow_image_exts: ['jpeg', 'jpg', 'png'],
  allow_image_upload_size: 10240,
  allow_image_clip: 0,
  image_clip_size_type: [],
  allow_audio_exts: ['mp3'],
  allow_audio_upload_size: 2048,
  allow_video_exts: ['mp4', 'mov'],
  allow_video_upload_size: 20480,
  allow_file_exts: 'docx|doc|xlsx|xls|pptx|ppt|pdf|apk|zip',
  allow_file_upload_size: 10240,
  allow_snippet_upload: 1,
  allow_transcode_video: 0
}

const formData = reactive<AttachmentSetting>({ ...defaultForm })

const imageTypeOptions = ref<Option[]>([])
const audioTypeOptions = ref<Option[]>([])
const videoTypeOptions = ref<Option[]>([])
const clipTypeOptions = ref<Option[]>([])

const rules: FormRules = {
  allow_image_exts: [
    { required: true, message: '图片类型必须选择', trigger: 'blur' }
  ]
}

const initDataSource = async () => {
  loading.value = true
  try {
    const options = await systemApi.getAttachmentOptions()
    if (options) {
      imageTypeOptions.value = options.imageTypeOptions
      audioTypeOptions.value = options.audioTypeOptions
      videoTypeOptions.value = options.videoTypeOptions
      clipTypeOptions.value = options.clipTypeOptions
    }
    const result = await systemApi.getSetting('attachment')
    if (result) {
      Object.assign(formData, result)
    }
  } catch (error) {
    console.error('Failed to load attachment setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        await systemApi.setAttachment(formData)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save attachment setting:', error)
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

defineExpose({
  initDataSource
})
</script>

<style lang="scss" scoped>
.setting-form {
  max-width: 800px;
}
</style>
