<!-- <template>
  <div class="attachment-upload-container">
    <div class="attachment-upload-header">
      <div class="title">DEMO</div>
    </div>
    <div class="attachment-upload-body">
      <div class="corew-el-upload-box">
        <el-upload
          class="corew-el-upload"
          ref="upload"
          drag
          action="void"
          :http-request="customUpload"
          :before-upload="handleBeforeUpload"
          :on-remove="handleRemove"
          :on-progress="handleProcess"
          :on-preview="onPreview"
          :file-list="fileList"
          :multiple="false"
          :auto-upload="true"
          list-type="picture"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">
            只能上传jpg/png文件，且不超过500kb
          </div>
        </el-upload>
        <div class="corew-chunk-process" v-if="false">
          <div class="corew-chunk-process-body">
            <div class="loading-box">
              <div
                class="current-loading"
                :style="{ width: snippetPercent + '%' }"
              ></div>
            </div>
            <div class="percent-val">{{ Math.round(snippetPercent) }}%</div>
          </div>
        </div>
      </div>
      <el-table
        :data="tableData"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="date" label="日期" width="180">
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="180">
        </el-table-column>
        <el-table-column prop="address" label="地址"> </el-table-column>
      </el-table>
    </div>
    <div class="attachment-upload-footer"></div>
  </div>
</template>
<script>
import { useAttachmentApi } from '@/api/attachment/index'
import Worker from '@/components/Uploader/Lib/hash.worker.js'
const attachmentApi = useAttachmentApi()

export default {
  name: 'UploadDemo',
  components: {},
  data() {
    return {
      tableData: [
        {
          date: '2016-05-02',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        },
        {
          date: '2016-05-04',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        },
        {
          date: '2016-05-01',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        },
        {
          date: '2016-05-03',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        }
      ],
      fileList: [],
      fileinfo: null,
      isShowFile: true,
      attachmentConfig: null,
      snippetPercent: 0,
      snippetUpload: false, // 大文件分片上传
      chunkSize: 5 * 1024 * 1024 // 1M
    }
  },
  computed: {},
  watch: {},
  mounted() {},
  created() {
    this.getAttachmentConfig()
  },
  beforeDestroy() {},
  methods: {
    tableRowClassName({ row, rowIndex }) {
      if (rowIndex === 1) {
        return 'warning-row'
      } else if (rowIndex === 3) {
        return 'success-row'
      }
      return ''
    },
    getUploadedFiles(ref = 'upload') {
      return this.$refs[ref].uploadFiles
    },
    async getAttachmentConfig() {
      this.attachmentConfig = await attachmentApi.config()
    },
    onPreview(file) {
      // console.log(file)
    },
    handleProcess(event, file, fileList) {
      // 文件正在上传时的钩子
    },
    handleBeforeUpload() {},
    handleRemove(file, fileList) {
      // console.log('222')
      // 移除上传文件
      this.$refs.upload.abort() //取消上传
      this.$message({ message: '成功移除' + file.name, type: 'success' })
      console.log('files:', fileList, this.fileList)
    },
    customUpload(uploader) {
      const file = uploader.file
      this.uploadFile(file, uploader)
    },
    onInputFileChange(e) {
      this.isShowFile = false
      const file = e.target.files[0]
      this.uploadFile(file)
    },
    async uploadFile(file, uploader = null) {
      const allowChunkUpload =
        'allow_snippet_upload' in this.attachmentConfig
          ? this.attachmentConfig.allow_snippet_upload
          : true
      if (
        file.size < this.attachmentConfig.max_package_size ||
        !allowChunkUpload
      ) {
        // 普通上传
        this.snippetUpload = false
        await this.sendFile(file, progressEvent => {
          let num = ((progressEvent.loaded / progressEvent.total) * 100) | 0 //百分比
          if (uploader) {
            uploader.onProgress({ percent: num }) //进度条
          }
        })
        console.log('uploadFile onSuccess')
        if (uploader) {
          uploader.onSuccess() //上传成功(打钩的小图标)
        }
        return true
      }

      // 分片上传
      this.snippetUpload = true
      this.createFileMd5(file).then(async fileMd5 => {
        // 先查询服务器是否已有上传完的文件切片
        let data = await this.getUploadedChunks(fileMd5)
        // console.log('this.$refs.upload:', this.$refs.upload.getFile(file))
        let uploaded = data.length ? data.map(m => m.split('-')[1] - 0) : []
        // 切割文件
        const chunkItems = await this.cutBlob(fileMd5, file, uploaded)
        // 开始上传
        // const fileObj = this.$refs.upload.getFile(file)
        this.sendRequest(chunkItems, 5, this.chunkMerge)
      })
    },
    createFileMd5(file) {
      return new Promise((resolve, reject) => {
        const worker = new Worker()
        worker.postMessage({ file, chunkSize: this.chunkSize })
        worker.onmessage = event => {
          resolve(event.data)
        }
        // worker.onerror = error => {
        //   console.log('error:', error)
        //   reject(error)
        // }
      })
    },
    // 文件分割
    cutBlob(fileHash, file, uploaded) {
      const chunkList = [] // 切片缓存数组
      const blobSlice =
        File.prototype.slice ||
        File.prototype.mozSlice ||
        File.prototype.webkitSlice
      const chunkNum = Math.ceil(file.size / this.chunkSize) // 切片总数

      return new Promise((resolve, reject) => {
        let startIndex, endIndex, contentItem

        for (let i = 0; i < chunkNum; i++) {
          // 如果已经上传则跳过
          if (uploaded.includes(i)) {
            continue
          }

          startIndex = i * this.chunkSize // 片段起点
          endIndex = (i + 1) * this.chunkSize // 片段尾点
          if (endIndex > file.size) {
            // 防止溢出
            endIndex = file.size
          }

          // 切片文件
          contentItem = blobSlice.call(file, startIndex, endIndex)
          chunkList.push({
            index: i,
            chunk: contentItem
          })
        }

        this.fileinfo = {
          hash: fileHash,
          total: chunkNum,
          name: file.name,
          raw: file,
          size: file.size
        }

        resolve(chunkList)
      })
    },
    // 请求并处理
    sendRequest(chunkItems, max = 6, callback) {
      this.isShowFile = true
      let fetchArr = []
      let toFetch = () => {
        if (!chunkItems.length) {
          return Promise.resolve()
        }

        const chunkItem = chunkItems.shift()
        const currentNum = chunkItem.index + 1
        const it = this.sendChunk(chunkItem)

        it.then(
          () => {
            // 成功从任务队列中移除
            fetchArr.splice(fetchArr.indexOf(it), 1)
          },
          err => {
            // 如果失败则重新放入总队列中
            chunkItems.unshift(chunkItem)
            console.error('send request error:', err)
          }
        )

        fetchArr.push(it)
        let p = Promise.resolve()
        if (fetchArr.length >= max) {
          // Promise.race() 返回一个 promise，一旦迭代器中的某个 promise 履行或拒绝，返回的 promise 就会履行或拒绝。
          // 当请求超过最大请求，就取最先执行的的请求
          p = Promise.race(fetchArr)
        }
        const fileObj = this.$refs.upload.getFile(this.fileinfo.raw)
        fileObj.status = 'uploading'
        const snippetPercent = Math.round(
          (currentNum / this.fileinfo.total) * 100,
          2
        )
        fileObj.percentage = snippetPercent == 100 ? 97.5 : snippetPercent
        if (snippetPercent > fileObj.percentage) {
          fileObj.percentage = snippetPercent
        }
        console.log('currentNum:', currentNum)
        console.log('snippetPercent:', snippetPercent)
        this.$refs.upload.onProgress({ percent: snippetPercent }) //进度条
        return p.then(() => toFetch())
      }

      toFetch().then(() => {
        Promise.all(fetchArr).then(
          () => {
            callback()
          },
          error => {
            console.error('to fetch error:', error)
          }
        )
      })
    },
    // 请求已上传文件
    getUploadedChunks(hash) {
      return attachmentApi.checkSnippet(hash)
    },
    // 分片文件上传
    sendChunk(item) {
      if (!item) {
        return
      }

      let formData = new FormData()
      formData.append('file', item.chunk)
      formData.append('index', item.index)
      formData.append('hash', this.fileinfo.hash)
      formData.append('filename', this.fileinfo.name)

      return attachmentApi.uploadSnippet(formData)
    },
    // 文件上传方法
    async sendFile(file, onUploadProgress) {
      let formData = new FormData()
      formData.append('file', file)
      await attachmentApi.uploadFile(formData, onUploadProgress)
      this.isShowFile = true
    },
    // 请求合并
    chunkMerge() {
      return attachmentApi
        .mergeSnippetFile(this.fileinfo)
        .then(response => {
          this.snippetPercent = 0
          const fileObj = this.$refs.upload.getFile(this.fileinfo.raw)
          if (fileObj) {
            fileObj.percentage = 100
            fileObj.status = 'success'
            fileObj.response = response
            fileObj.url = response.cover
            this.$refs.upload.onSuccess(response, fileObj, this.fileList)
            this.$refs.upload.onChange(fileObj, this.fileList)
            console.log('chunkMerge fileList:', this.getUploadedFiles())
          }
        })
        .catch(err => {
          this.snippetPercent = 0
          const fileObj = this.$refs.upload.getFile(this.fileinfo.raw)
          if (fileObj) {
            fileObj.status = 'fail'
            let fileList = this.fileList
            fileList.splice(fileList.indexOf(fileObj), 1)
            this.$refs.upload.onError(err, fileObj, this.fileList)
            this.$refs.upload.onChange(fileObj, this.fileList)
          }
        })
    }
  }
}
</script>
<style lang="scss" scoped>
.attachment-upload-container {
  margin: 0px auto;
  .attachment-upload-header {
    background-color: #e4aa0a;
    height: 120px;
    display: flex;
    justify-content: center;
    line-height: 120px;
  }
  .attachment-upload-body {
    .el-table .warning-row {
      background: oldlace;
    }

    .el-table .success-row {
      background: #f0f9eb;
    }
    .corew-el-upload-box {
      width: 600px;
      margin: 10px auto;
      .corew-el-upload {
        text-align: center;
        .el-upload__tip {
          width: 360px;
          display: inline-block;
        }
        .el-upload-list {
          width: 360px !important;
          display: inline-block;
        }
      }

      .corew-chunk-process {
        margin-top: 15px;
        .corew-chunk-process-body {
          width: 360px;
          margin: 0 auto;
          height: 40px;
          .input-title {
            float: left;
            line-height: 40px;
            font-size: 14px;
            text-align: right;
            width: 80px;

            .text {
              color: #666;
            }
          }

          .files {
            display: none;
          }

          .input {
            float: left;
            width: 400px;
            margin-left: 16px;
          }
          .icon-btn {
            margin-top: 5px;
            margin-left: 16px;
            float: left;
            height: 30px;
            line-height: 30px;
            padding-right: 10px;
            padding-left: 10px;
            background-color: #0099ff;
            border-radius: 5px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.35s;
          }
          .upload-btn {
            &:hover {
              opacity: 0.8;
            }
          }
          .ban-button {
            cursor: not-allowed;
            background-color: #eeeff3;
          }

          .loading-box {
            margin-top: 15px;
            float: left;
            width: 270px;
            height: 10px;
            background-color: #f6f6f6;
            border-radius: 5px;
            margin-left: 15px;

            .current-loading {
              height: 10px;
              border-radius: 5px;
              background-color: #3399cc;
              /*width: 50%;*/
            }
          }

          .percent-val {
            line-height: 40px;
            width: 60px;
            text-align: center;
            font-size: 14px;
            color: #666;
            float: left;
          }
          .cancel-btn {
            line-height: 40px;
            font-size: 14px;
            color: #999;
            text-decoration: underline;
            cursor: pointer;
            user-select: none;

            &:hover {
              color: #3399cc;
            }
          }
          .del-btn {
            line-height: 40px;
            font-size: 14px;
            color: #999;
            text-decoration: underline;
            cursor: pointer;
            user-select: none;

            &:hover {
              color: #3399cc;
            }
          }
        }
        .limit-info {
          color: #999;
          font-size: 14px;
          padding-left: 96px;
          line-height: 34px;
          height: 34px;
        }
        .file-state {
          width: 270px;
          margin-left: 95px;
          overflow: hidden;
          .file-name {
            float: left;
            width: 210px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            color: #999;

            a {
              color: #999;
              font-size: 14px;
              text-decoration: none;

              &:hover {
                color: #3399cc;
              }
            }
          }
          .state {
            float: right;
            font-size: 14px;
            color: #1db396;
          }
        }
      }
    }
  }
  .attachment-upload-footer {
  }
}
</style>
<style lang="scss">
.attachment-upload-container {
  .attachment-upload-body {
    .corew-el-upload-box {
      .corew-el-upload {
        .el-upload-list {
          width: 360px;
          display: inline-block;
        }
      }
    }
  }
}
</style> -->
<template>
    <div>

    </div>
</template>
<script>
export default {
   name: 'TemplateName',
   data() {
      return {
      }
   },
   methods: {
   },
}
</script>
<style lang="less" scoped>

</style>
