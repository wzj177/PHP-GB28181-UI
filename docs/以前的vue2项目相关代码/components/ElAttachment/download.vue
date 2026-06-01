<template>
  <div class="download">
    <el-progress
      :percentage="progressPercentage"
      :text-inside="true"
      :stroke-width="24"
      status="success"
      v-show="showProgress"
    />
    <i class="el-icon-close close-download" v-show="showProgress" @click.stop="cancelDownload"></i>
    <el-button
      @click="startDownload"
      :size="size"
      :type="type"
      :class="customClass"
      v-show="!showProgress"
    >{{ btnText }}</el-button>
  </div>
</template>

<script>
import { useAttachmentApi } from '@/api/attachment'
import axios from 'axios'
const attachmentAPI = useAttachmentApi()
export default {
  name: 'Download',
  props: {
    customClass: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'mini'
    },
    btnText: {
      type: String,
      default: '开始下载'
    },
    file: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      progressPercentage: 0,
      showProgress: false,
      cancelToken: null,
      chunkSize: 1 * 1024 * 1024,
      contentList:[]
    }
  },

  mounted() {},

  methods: {
    // 取消下载按钮点击事件
    cancelDownload() {
      if (this.cancelToken) {
        this.cancelToken.cancel('cancel')
        this.showProgress = false
      }
    },
    // 下载按钮点击事件，调用分段下载函数
    startDownload() {
      this.showProgress = true
      this.downloadFile()
    },
    onDownloadProgress(progressEvent) {
      if (progressEvent.lengthComputable) {
        const percentage = Math.floor(
          (progressEvent.loaded / progressEvent.total) * 100
        )
        this.progressPercentage = percentage
      }
    },
    // 分段下载函数，使用 Axios 发送分段下载请求
    downloadFile() {
      this.cancelToken = axios.CancelToken.source()
      let func =
        this.file.fileSize > 2 * 1024 * 1024 ? 'bigFileDownload' : 'download'
      if (func === 'download') {
        // 发送下载请求
        return attachmentAPI
          .download(this.file.id, this.onDownloadProgress, this.cancelToken)
          .then(response => {
            // 处理下载完成后的逻辑，比如将 Blob 转换为文件并保存
            this.saveFile(response)
          })
          .catch(error => {
            // 处理下载失败的逻辑
            if (axios.isCancel(error)) {
              console.log('请求已被取消：', error.message)
            } else {
              this.$notify({
                title: ' 错误提示',
                dangerouslyUseHTMLString: true,
                message: '下载失败：:' + error.message,
                type: 'error'
              })
            }
            this.showProgress = false
          })
      }
      const fileTotalSize = this.file.fileSize
      // 初始化第一个分段请求
      const start = 0
      const end = Math.min(this.chunkSize - 1, fileTotalSize - 1)
      this.downloadChunk(this.file.filepath, start, end)
    },
    downloadChunk(fileUrl, start, end) {
      const headers = {
        Range: `bytes=${start}-${end}`
      }
      const chunkPages = Math.ceil(this.file.fileSize / this.chunkSize)
      console.log('chunkPages:', chunkPages)
      attachmentAPI
        .bigFileDownload(
          fileUrl,
          progressEvent => {
            const currentPage = Math.ceil(end / this.chunkSize)
            // 当前分段总进度
            const pageRate = (currentPage / chunkPages).toFixed(3)
            // 当前分段下载进度
            const percentage = Math.floor(
              ((progressEvent.loaded / progressEvent.total) * pageRate) * 100
            )

            this.progressPercentage = percentage
          },
          headers,
          this.cancelToken
        )
        .then(response => {
          // 处理当前分段的响应数据
          // response.data 包含当前分段的文件内容的二进制数据
          // 可以根据需要保存文件或进行其他处理
          // 继续发送下一个分段请求
          const nextStart = end + 1
          const nextEnd = end + this.chunkSize
          this.contentList.push(response)
          if (nextStart < this.file.fileSize) {
            this.downloadChunk(
              fileUrl,
              nextStart,
              Math.min(nextEnd, this.file.fileSize - 1)
            )
          } else {
            // 所有分段下载完成
            // console.log('下载完成！')
            const blob = new Blob(this.contentList)
            this.saveFile(blob)
            this.contentList = []
            this.progressPercentage = 0
            this.showProgress = false
          }
        })
        .catch(error => {
          // 下载失败，处理错误
          console.error('下载失败：', error)
        })
    },
    // 将 Blob 对象转换为文件并保存
    saveFile(blobData) {
      const fileName = this.file.filename // 下载文件的文件名，根据实际情况修改
      const downloadLink = document.createElement('a')
      const url = window.URL.createObjectURL(new Blob([blobData]))
      downloadLink.href = url
      downloadLink.setAttribute('download', fileName)
      document.body.appendChild(downloadLink)
      downloadLink.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(downloadLink)
      this.showProgress = false
    }
  }
}
</script>

<style lang="scss" scoped>
.download {
  // display: inline-block;
  // width: 100px;
  position: relative;
  margin: 0 0 5px 10px;
  ::v-deep .el-progress {
    margin: 5px 0;
  }
  .close-download {
    position: absolute;
    z-index: 10;
    right: 2px;
    top: 5px;
    font-size: 12px;
    color: #000;
  }
}
</style>
