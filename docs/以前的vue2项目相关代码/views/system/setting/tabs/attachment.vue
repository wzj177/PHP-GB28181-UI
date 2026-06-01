<template>
  <el-form
    ref="attachmentForm"
    v-loading="loading"
    :model="attachmentForm"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="图片类型：" prop="allow_image_exts">
      <el-checkbox-group v-model="attachmentForm.allow_image_exts">
        <el-checkbox
          v-for="(item, key) in imageTypeOptions"
          :key="key"
          :label="item.value"
          >{{ item.name }}</el-checkbox
        >
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="图片大小限制：" prop="allow_image_upload_size">
      <el-input
        v-model="attachmentForm.allow_image_upload_size"
        type="number"
        style="width: 200px"
      >
        <template slot="append">KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 10240KB</div>
    </el-form-item>
    <el-form-item label="是否开启图片裁剪：" prop="site_seo_keywords">
      <el-radio v-model="attachmentForm.allow_image_clip" :label="1"
        >开启</el-radio
      >
      <el-radio v-model="attachmentForm.allow_image_clip" :label="0"
        >关闭</el-radio
      >
    </el-form-item>
    <el-form-item label="图片裁剪尺寸：" prop="image_clip_size_type">
      <el-checkbox-group v-model="attachmentForm.image_clip_size_type">
        <el-checkbox
          v-for="(item, key) in clipTypeOptions"
          :key="key"
          :label="item.value"
          >{{ item.name }}</el-checkbox
        >
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="音频类型：" prop="allow_audio_exts">
      <el-checkbox-group v-model="attachmentForm.allow_audio_exts">
        <el-checkbox
          v-for="(item, key) in audioTypeOptions"
          :key="key"
          :label="item.value"
          >{{ item.name }}</el-checkbox
        >
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="音频大小限制：" prop="allow_audio_upload_size">
      <el-input
        v-model="attachmentForm.allow_audio_upload_size"
        type="number"
        style="width: 200px"
      >
        <template slot="append">KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 10240KB</div>
    </el-form-item>
    <el-form-item label="视频类型：" prop="allow_video_exts">
      <el-checkbox-group v-model="attachmentForm.allow_video_exts">
        <el-checkbox
          v-for="(item, key) in videoTypeOptions"
          :key="key"
          :label="item.value"
          >{{ item.name }}</el-checkbox
        >
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="视频大小限制：" prop="allow_video_upload_size">
      <el-input
        v-model="attachmentForm.allow_video_upload_size"
        type="number"
        style="width: 200px"
      >
        <template slot="append">KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 20480KB</div>
    </el-form-item>
    <el-form-item label="是否开启视频格式转化：" prop="allow_transcode_video">
      <el-radio v-model="attachmentForm.allow_transcode_video" :label="1"
        >开启</el-radio
      >
      <el-radio v-model="attachmentForm.allow_transcode_video" :label="0"
        >关闭</el-radio
      >
       <div class="el-upload__tip">默认将非 mp4 视频，转 mp4</div>
    </el-form-item>
    <el-form-item label="其它文件类型：" prop="allow_file_exts">
      <el-input v-model="attachmentForm.allow_file_exts">
        <template slot="append">文件后缀名</template>
      </el-input>
      <div class="el-upload__tip">多个以英文"|"隔开</div>
    </el-form-item>
    <el-form-item label="其它文件大小限制：" prop="allow_file_upload_size">
      <el-input
        v-model="attachmentForm.allow_file_upload_size"
        type="number"
        style="width: 200px"
      >
        <template slot="append">KB</template>
      </el-input>
      <div class="el-upload__tip">默认为 10240KB</div>
    </el-form-item>
    <el-form-item label="是否开启分片上传：" prop="allow_snippet_upload">
      <el-radio v-model="attachmentForm.allow_snippet_upload" :label="1"
        >开启</el-radio
      >
      <el-radio v-model="attachmentForm.allow_snippet_upload" :label="0"
        >关闭</el-radio
      >
       <div class="el-upload__tip">只有当当文件超过webman server max_package_size 配置时，才会进行分片</div>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm('attachmentForm')"
        >保存</el-button
      >
      <el-button @click="resetForm('attachmentForm')">重置</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
// import { view, attachmentOptions, attachmentSet } from '@/api/setting'
import { useSystemApi } from '@/api/system'
const systemApi = useSystemApi()

export default {
  data() {
    return {
      loading: false,
      attachmentForm: {
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
        allow_transcode_video: 0,
      },
      imageTypeOptions: [],
      audioTypeOptions: [],
      videoTypeOptions: [],
      clipTypeOptions: [],
      rules: {
        allow_image_exts: [
          { required: true, message: '图片类型必须选择', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    async initDataSource() {
      this.loading = true
      const {
        imageTypeOptions,
        audioTypeOptions,
        videoTypeOptions,
        clipTypeOptions
      } = await systemApi.getAttachmentOptions()
      this.imageTypeOptions = imageTypeOptions
      this.audioTypeOptions = audioTypeOptions
      this.videoTypeOptions = videoTypeOptions
      this.clipTypeOptions = clipTypeOptions
      const result = await systemApi.getSetting('attachment')
      if (result) {
        this.attachmentForm = result
      }
      this.loading = false
    },
    submitForm() {
      this.$refs.attachmentForm.validate(async valid => {
        if (valid) {
          await systemApi.setAttachment(this.attachmentForm)
          this.$notify({
            title: '成功提示',
            dangerouslyUseHTMLString: true,
            message: '保存成功',
            type: 'success'
          })
        }
        return false
      })
    },
    resetForm() {
      this.$refs.attachmentForm.resetFields()
    }
  }
}
</script>
