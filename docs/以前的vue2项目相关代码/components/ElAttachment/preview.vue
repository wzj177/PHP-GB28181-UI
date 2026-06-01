<template>
  <div class="preview">
    <el-dialog
      title="附件预览"
      v-if="showDialog"
      :visible.sync="previewDialogVisible"
      width="70%"
      center
    >
      <div v-if="previewFile != null">
        <el-image
          v-if="previewFile.type === 'image'"
          style="height: 550px;width:100%;"
          :src="previewFile.url"
        />
        <video
          :src="previewFile.url"
          controls
          autoplay
          muted
          v-else-if="previewFile.type === 'video'"
          style="height: 550px;width:100%;"
        />
        <audio
          :src="previewFile.url"
          controls
          autoplay
          muted
          v-else-if="previewFile.type === 'audio'"
          style="width:100%;"
        ></audio>
        <el-empty v-else description="暂不支持该类型文件预览"></el-empty>
      </div>
      <!-- <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="previewDialogVisible = false">关 闭</el-button>
      </span>-->
    </el-dialog>
    <image-viewer
      v-if="showViewer"
      :zIndex="8000"
      :on-close="
        $event => {
          showViewer = false
        }
      "
      :url-list="previewImgList"
      :initial-index="preIniIndex"
    />
  </div>
</template>

<script>
import ImageViewer from 'element-ui/packages/image/src/image-viewer.vue'

export default {
  name: 'AttachmentPreviewDialog',

  data() {
    return {
      previewDialogVisible: false,
      previewFile: null,
      showViewer: false,
      showDialog: false,
      preIniIndex: 0,
      previewImgList: []
    }
  },
  components: {
    ImageViewer
  },
  mounted() {},

  methods: {
    open(file) {
      this.previewFile = file
      this.showDialog = true
      this.previewDialogVisible = true
    },
    close() {
      this.previewFile = null
      this.previewDialogVisible = false
      this.$emit('close')
    },
    openImages(urls) {
      if (!urls.length) {
        return false
      }
      
      this.previewImgList = urls
      this.showViewer = true
      this.showDialog = false
    }
  }
}
</script>

<style lang="scss" scoped>
</style>