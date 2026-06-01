<template>
  <div class="corew-el-upload-drag-box">
    <!-- 上传组件风格之按钮单文件上传 start  -->
    <el-upload
      v-if="styleMode == 'btn'"
      class="corew-el-upload-btn"
      :show-file-list="showFileList"
      ref="upload"
      action="void"
      :limit="1"
      :auto-upload="autoUpload"
      :on-change="onChange"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :accept="accept"
    >
      <el-button size="small" type="primary" icon="el-icon-upload2"
        >点击上传</el-button
      >
      <div class="corw-btn-upload-tip" slot="tip">
        <span class="text">上传限制说明</span>
        <el-tooltip
          class="item"
          effect="dark"
          :content="showUploadTip"
          placement="top"
        >
          <i class="el-icon-question"></i>
        </el-tooltip>
      </div>
      <!-- <div class="el-upload__tip" slot="tip" v-if="showUploadTip">{{showUploadTip}}</div> -->
    </el-upload>
    <!-- 上传组件风格之按钮单文件上传 end -->
    <!-- 上传组件风格之头像单文件上传 start -->
    <el-upload
      v-if="styleMode == 'avatar'"
      class="corew-el-upload-avatar"
      :show-file-list="showFileList"
      ref="upload"
      action="void"
      :limit="1"
      :auto-upload="autoUpload"
      :on-change="onChange"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :accept="accept"
    >
      <img v-if="showImgUrl" :src="showImgUrl" class="avatar" />
      <i v-else class="el-icon-plus corew-el-upload-avatar-icon"></i>
      <div class="el-upload__tip" slot="tip" v-if="showUploadTip">
        {{ showUploadTip }}
      </div>
    </el-upload>
    <!-- 上传组件风格之头像单文件上传 end -->
    <!-- 上传组件风格之图片多文件上传  start -->
    <el-upload
      class="corew-el-upload-pictures"
      v-if="styleMode == 'pictures'"
      ref="upload"
      action="void"
      list-type="picture-card"
      :auto-upload="autoUpload"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-change="onChange"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :file-list="fileList"
      :limit="maxLimit"
      :accept="accept"
    >
      <i
        slot="default"
        class="el-icon-plus"
        v-if="maxLimit > 0 && chooseFileCount <= maxLimit"
      ></i>
      <div slot="file" slot-scope="{ file }">
        <img class="el-upload-list__item-thumbnail" :src="file.url" alt />
        <span class="el-upload-list__item-actions">
          <span
            class="el-upload-list__item-preview"
            @click="handlePictureCardPreview(file)"
          >
            <i class="el-icon-zoom-in"></i>
          </span>
          <!-- <span v-if="!disabled" class="el-upload-list__item-delete" @click="handleDownload(file)">
            <i class="el-icon-download"></i>
          </span>-->
          <span class="el-upload-list__item-delete" @click="handleRemove(file)">
            <i class="el-icon-delete"></i>
          </span>
        </span>
      </div>
      <div class="el-upload__tip" slot="tip" v-if="showUploadTip">
        {{ showUploadTip }}
      </div>
    </el-upload>
    <!-- 上传组件风格之图片多文件上传  end -->
    <!-- 上传组件风格之拖拽多文件上传  start -->
    <el-upload
      v-if="styleMode == 'drag'"
      class="corew-el-upload-drag"
      :show-file-list="showFileList"
      ref="upload"
      drag
      action="void"
      :http-request="customUpload"
      :before-upload="onBeforeUpload"
      :on-exceed="onExceed"
      :on-remove="onRemove"
      :on-progress="onProcess"
      :on-preview="onPreview"
      :on-success="onSuccess"
      :file-list="fileList"
      :multiple="multiple"
      :limit="maxLimit"
      :accept="accept"
    >
      <i
        class="el-icon-upload"
        v-if="maxLimit > 0 && chooseFileCount <= maxLimit"
      ></i>
      <div
        class="el-upload__text"
        v-if="maxLimit > 0 && chooseFileCount <= maxLimit"
      >
        将文件拖到此处，或
        <em>点击上传</em>
      </div>
      <div class="el-upload__tip" slot="tip" v-if="showUploadTip">
        {{ showUploadTip }}
      </div>
    </el-upload>
    <!-- 上传组件风格之拖拽多文件上传  end -->
    <!-- 图片预览 start -->
    <el-dialog :visible.sync="dialogVisible" :append-to-body="true">
      <img width="100%" :src="dialogImageUrl" alt />
    </el-dialog>
    <!-- 图片预览 end -->
    <!-- 图片裁剪 start-->
    <el-dialog
      title="图片裁剪"
      v-if="cropImg"
      :visible.sync="cropDialogVisible"
      width="960px"
      append-to-body
      @open="onOpenCropDialog"
    >
      <div class="cropper-content">
        <div class="cropper-box">
          <div class="cropper">
            <vueCropper
              ref="cropper"
              :img="cropper.img"
              :outputSize="cropper.outputSize"
              :outputType="cropper.outputType"
              :info="cropper.info"
              :canScale="cropper.canScale"
              :autoCrop="cropper.autoCrop"
              :autoCropWidth="cropper.autoCropWidth"
              :autoCropHeight="cropper.autoCropHeight"
              :fixed="cropper.fixed"
              :fixedNumber="cropper.fixedNumber"
              :full="cropper.full"
              :fixedBox="cropper.fixedBox"
              :canMove="cropper.canMove"
              :canMoveBox="cropper.canMoveBox"
              :original="cropper.original"
              :centerBox="cropper.centerBox"
              :height="cropper.height"
              :infoTrue="cropper.infoTrue"
              :maxImgSize="cropper.maxImgSize"
              :enlarge="cropper.enlarge"
              :mode="cropper.mode"
              @realTime="cropRealTime"
              @imgLoad="cropImgLoad"
            ></vueCropper>
          </div>
        </div>
        <div class="show-preview">
          <div :style="cropPreviews.div" class="preview">
            <img :src="cropPreviews.url" :style="cropPreviews.img" />
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cropDialogVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click.stop="finishCropper"
          :loading="cropperLoading"
          >确认</el-button
        >
      </div>
    </el-dialog>
    <!-- 图片裁剪 end-->
  </div>
</template>
<script>
import { VueCropper } from 'vue-cropper'
import { useAttachmentApi } from '@/api/attachment/index'
import Worker from '@/components/Uploader/Lib/hash.worker.js'
const attachmentApi = useAttachmentApi()

// TODO: v-model 封装:https://juejin.cn/post/6844904199461847048
export default {
  name: 'CoreWUpload',
  components: {
    VueCropper
  },
  props: {
    autoUpload: {
      type: Boolean,
      default: true
    },
    styleMode: {
      type: String,
      default: 'drag' // drag:拖拽上传风格,avatar:头像单文件上传风格, pictures:图片多文件上传风格
    },
    imageUrl: '',
    // showFileList: {
    //   // 是否显示已上传文件列表
    //   type: Boolean,
    //   default: false
    // },
    maxLimit: {
      // 最大允许上传个数
      type: Number,
      default: 0
    },
    accept: {
      // 接受上传的文件类型（thumbnail-mode 模式下此参数无效）
      type: String,
      default: ''
    },
    uploadTip: {
      type: String,
      default: ''
    },
    cropImg: {
      type: Boolean,
      default: false
    },
    cropImgSize: {
      type: Array,
      default() {
        return []
      }
    },
    cropFixedNumber: {
      type: Array,
      default() {
        return []
      }
    }
  },
  data() {
    return {
      showUploadTip: '', // 上传提示
      dialogImageUrl: '', // 预览图
      dialogVisible: false, // 预览 dialog
      group: 'default', // 附件分组
      fileList: [], // 文件列表
      chooseFileCount: 0, // 添加文件数量
      showFileList: false, // 是否显示已上传文件列表
      fileinfo: null, // 文件信息（分片上传使用）
      attachmentConfig: null, // 系统附件设置
      showImgUrl: '', // 图片预览(头像上传风格使用)
      multiple: true, // 是否支持多选文件
      snippetPercent: 0, // 分片上传进度
      snippetUpload: false, // 大文件分片上传标识
      chunkSize: 5 * 1024 * 1024, // 分片文件大小
      cropDialogVisible: false,
      cropper: {
        img: '',
        outputSize: 1, //裁剪生成图片的质量(可选0.1 - 1)
        outputType: 'jpeg', //裁剪生成图片的格式（jpeg || png || webp）
        info: true, //图片大小信息
        canScale: true, //图片是否允许滚轮缩放
        autoCrop: true, //是否默认生成截图框
        autoCropWidth: 480, //默认生成截图框宽度
        autoCropHeight: 270, //默认生成截图框高度
        fixed: true, //是否开启截图框宽高固定比例
        fixedNumber: [1, 1], //截图框的宽高比例
        full: true, //false按原比例裁切图片，不失真
        fixedBox: true, //固定截图框大小，不允许改变
        canMove: false, //上传图片是否可以移动
        canMoveBox: true, //截图框能否拖动
        original: false, //上传图片按照原始比例渲染
        centerBox: false, //截图框是否被限制在图片里面
        height: true, //是否按照设备的dpr 输出等比例图片
        infoTrue: false, //true为展示真实输出图片宽高，false展示看到的截图框宽高
        maxImgSize: 3000, //限制图片最大宽度和高度
        enlarge: 1, //图片根据截图框输出比例倍数
        mode: 'cover' //图片默认渲染方式
      },
      cropperLoading: false,
      cropPreviews: {}
    }
  },
  created() {
    this.showImgUrl = this.imageUrl
    this.showUploadTip = this.uploadTip
    if (this.styleMode === 'drag') {
      this.showFileList = true
    }

    this.getAttachmentConfig()
  },
  watch: {
    imageUrl(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.showImgUrl = newVal
      }
    }
  },
  beforeDestroy() {
    console.log('beforeDestroy uploader')
  },
  methods: {
    init(options) {
      if ('showImgUrl' in options) {
        this.showImgUrl = options['showImgUrl']
      }
      // TODO: 最好把附件配置初始化到组件
    },
    setGroup(group) {
      this.group = group ? group : 'default'
    },
    setChunKSize(chunkSize) {
      this.chunkSize = chunkSize
    },
    reset() {
      this.showImgUrl = ''
      this.fileinfo = null
      this.fileList = []
      this.group = 'default'
      this.dialogVisible = false
      this.$refs.upload.clearFiles()
    },
    onOpenCropDialog() {},
    // 打开图片裁剪弹框
    openCropDialog(file) {
      if (this.cropImgSize.length === 2) {
        this.cropper.autoCropWidth = this.cropImgSize[0]
        this.cropper.autoCropHeight = this.cropImgSize[1]
      }

      if (this.cropFixedNumber.length === 2) {
        this.cropper.fixedNumber = this.cropFixedNumber
      }
      this.$nextTick(() => {
        this.cropper.img = URL.createObjectURL(file.raw)
        this.cropDialogVisible = true
      })
    },
    // 覆盖裁剪组件参数
    setCropOptions(options) {
      this.cropper = { ...this.cropper, ...options }
    },
    cropRealTime(data) {
      this.cropPreviews = data
    },
    cropImgLoad(msg) {
      console.log('工具初始化函数=====' + msg)
    },

    blobToFile(Blob, fileName) {
      //兼容IE
      Blob.lastModifiedDate = new Date()
      Blob.name = fileName
      return new File([Blob], fileName)
    },
    finishCropper() {
      this.$refs.cropper.getCropBlob(data => {
        let form = new FormData()
        let file = this.blobToFile(data, 'file.jpg')
        form.append('file', file)
        // const file = uploader.file
        this.uploadFile(file, this.$refs.upload)
        // upload(form).then(response => {
        //   this.imageUrl = URL.createObjectURL(data)
        //   this.cropperLoading = false
        //   this.cropDialogVisible = false
        //   this.$emit('onSuccess', response.data)
        // })
      })
    },
    setShowImgUrl(url) {
      this.showImgUrl = url
    },
    // 移除文件
    async handleRemove(file) {
      this.$refs.upload.handleRemove(file)
      // console.log('remove:', file)
      if (file.response && file.response.fileId) {
        await attachmentApi.delete(file.response.fileId)
      }
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    getUploadedChunkFiles(ref = 'upload') {
      return this.$refs[ref].uploadFiles
    },
    async getAttachmentConfig() {
      this.attachmentConfig = await attachmentApi.config()
      this.setUploadTipBySysConfig()
    },
    setUploadTipBySysConfig() {
      if (this.showUploadTip) {
        return true
      }
      let allowExts = []
      if (this.accept.indexOf('image/') >= 0) {
        allowExts = this.attachmentConfig.allow_image_exts
        const extStr = allowExts.join('/')
        const imgMaxSize =
          (this.attachmentConfig.allow_image_upload_size / 1024).toFixed(2) +
          'MB'
        this.showUploadTip = `只能上传${extStr}文件，且图片大小不超过${imgMaxSize}`
      } else if (this.accept.indexOf('audio/') >= 0) {
        allowExts = this.attachmentConfig.allow_audio_exts
        const extStr = allowExts.join('/')
        const audioMaxSize =
          (this.attachmentConfig.allow_audio_upload_size / 1024).toFixed(2) +
          'MB'
        this.showUploadTip = `只能上传${extStr}文件，且 音频大小不超过${audioMaxSize}`
      } else if (this.accept.indexOf('video/') >= 0) {
        allowExts = this.attachmentConfig.allow_video_exts
        const extStr = allowExts.join('/')
        const videoMaxSize =
          (this.attachmentConfig.allow_file_upload_size / 1024).toFixed(2) +
          'MB'
        this.showUploadTip = `只能上传${extStr}文件，且视频大小不超过${videoMaxSize}`
      } else {
        allowExts = [
          ...this.attachmentConfig.allow_image_exts,
          ...this.attachmentConfig.allow_audio_exts,
          ...this.attachmentConfig.allow_video_exts,
          ...this.attachmentConfig.allow_file_exts
        ]
        const extStr = allowExts.join('/')
        const imgMaxSize =
          (this.attachmentConfig.allow_image_upload_size / 1024).toFixed(2) +
          'MB'
        const audioMaxSize =
          (this.attachmentConfig.allow_audio_upload_size / 1024).toFixed(2) +
          'MB'
        const videoMaxSize =
          (this.attachmentConfig.allow_video_upload_size / 1024).toFixed(2) +
          'MB'
        const otherFileMaxSize =
          (this.attachmentConfig.allow_file_upload_size / 1024).toFixed(2) +
          'MB'

        this.showUploadTip = `只能上传${extStr}文件，且图片大小不超过${imgMaxSize}、视频大小不超过${videoMaxSize}、音频大小不超过${audioMaxSize}、其它类型文件不超过${otherFileMaxSize}`
      }
    },
    onExceed(files, fileList) {
      // 文件超出个数限制时的钩子
      if (this.maxLimit > 0) {
        this.$message.warning(
          `当前限制选择 ${this.maxLimit} 个文件，本次选择了 ${
            files.length
          } 个文件，共选择了 ${files.length + fileList.length} 个文件`
        )
      }
    },
    onPreview(file) {
      // 点击文件列表中已上传的文件时的钩子
      // console.log(file)
    },
    onProcess(event, file, fileList) {
      // 文件正在上传时的钩子
    },
    onBeforeUpload(file) {
      // 上传文件之前的钩子，参数为上传的文件，若返回 false 或者返回 Promise 且被 reject，则停止上传
      // if (this.maxLimit > 0 && this.fileList.length >= this.maxLimit) {
      //   this.$message.error(`上传失败，最多允许上传${this.maxLimit}个文件`)
      //   return false
      // }
      const fa = file.name.split('.')
      const ext = fa[fa.length - 1].toLowerCase()
      if (file.type.indexOf('image/') >= 0) {
        // 图片类型文件校验
        return this._validateFile(
          'image',
          ext,
          file.size,
          this.attachmentConfig.allow_image_exts,
          this.attachmentConfig.allow_image_upload_size
        )
      }

      if (file.type.indexOf('audio/') >= 0) {
        // 音频类型文件校验
        return this._validateFile(
          'audio',
          ext,
          file.size,
          this.attachmentConfig.allow_audio_exts,
          this.attachmentConfig.allow_audio_upload_size
        )
      }
      if (file.type.indexOf('video/') >= 0) {
        // 视频类型文件校验
        return this._validateFile(
          'video',
          ext,
          file.size,
          this.attachmentConfig.allow_video_exts,
          this.attachmentConfig.allow_video_upload_size
        )
      }

      // 其它类型文件校验
      return this._validateFile(
        'other',
        ext,
        file.size,
        this.attachmentConfig.allow_file_exts,
        this.attachmentConfig.allow_file_upload_size
      )
    },
    _validateFile(fileType, ext, fileSize, allowExts, allowSize) {
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
        this.$message.error(`上传失败，${fileTypeText}只能是 ${exts} 格式!`)
        return false
      }

      if (
        this.checkFileIsUseNormalUpload(fileSize) &&
        fileSize > allowSize * 1024
      ) {
        const maxSize = (allowSize / 1024).toFixed(2) + 'MB'
        this.$message.error(`上传失败，${fileTypeText}大小不能超过${maxSize}!`)
        return false
      }

      return true
    },
    onChange(file, fileList) {
      // 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
      this.chooseFileCount = fileList.length
      if (this.maxLimit > 0 && this.chooseFileCount > this.maxLimit) {
        this.$message.warning(`上传失败，最多允许上传${this.maxLimit}个文件`)
        this.fileList = fileList.slice(-this.maxLimit)
        this.$refs.upload.clearFiles()
        return false
      }

      if (!this.autoUpload && this.cropImg) {
        this.openCropDialog(file)
      }
    },
    onSuccess(res, file, fileList) {
      // 文件上传成功时的钩子
      // console.log('res:', res)
      // this.imageUrl = URL.createObjectURL(file.raw)
      this.$notify({
        title: '成功提示',
        dangerouslyUseHTMLString: true,
        message: '上传成功',
        type: 'success'
      })
      if (['avatar', 'btn'].includes(this.styleMode)) {
        this.$refs.upload.clearFiles()
      }
      this.showImgUrl = res.cover
      if (this.cropImg && this.cropDialogVisible) {
        this.cropDialogVisible = false
        this.cropper.img = ''
      }

      this.$emit('success', res, file, fileList)
    },
    onError(error, file, fileList) {
      // 文件上传失败时的钩子
      this.$notify({
        title: 'Fail',
        dangerouslyUseHTMLString: true,
        message: '上传失败:' + error.message,
        type: 'error'
      })
      this.$emit('error', error, file, fileList)
    },
    async onRemove(file, fileList) {
      // 文件列表移除文件时的钩子
      this.$refs.upload.abort() //取消上传
      if (file.response && file.response.fileId) {
        await attachmentApi.delete(file.response.fileId)
        this.$message({ message: '成功移除' + file.name, type: 'success' })
      }
      // console.log('files:', fileList, this.fileList)
    },
    customUpload(uploader) {
      // 自定义上传
      const file = uploader.file
      this.uploadFile(file, uploader)
    },
    checkFileIsUseNormalUpload(fileSize) {
      // 检查文件是否使用普通上传
      const allowChunkUpload =
        'allow_snippet_upload' in this.attachmentConfig
          ? this.attachmentConfig.allow_snippet_upload
          : true

      return (
        fileSize < this.attachmentConfig.max_package_size || !allowChunkUpload
      )
    },
    async uploadFile(file, uploader = null) {
      if (this.checkFileIsUseNormalUpload(file.size)) {
        // 普通上传
        this.snippetUpload = false
        this.sendFile(file, uploader, progressEvent => {
          let num = ((progressEvent.loaded / progressEvent.total) * 100) | 0 //百分比
          if (uploader) {
            uploader.onProgress({ percent: num }) //进度条
          }
        })

        return true
      }

      this.$notify({
        title: '提示',
        dangerouslyUseHTMLString: true,
        message: '文件正在进行分片上传，请耐心等待',
        type: 'info'
      })
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
        fileObj.percentage = snippetPercent * 0.95
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
    sendFile(file, uploader = null, onUploadProgress) {
      let formData = new FormData()
      formData.append('file', file)
      formData.append('group', this.group)
      attachmentApi
        .uploadFile(formData, onUploadProgress)
        .then(response => {
          if (uploader) {
            file.status = 'success'
            uploader.onSuccess(response, file, this.fileList) //上传成功(打钩的小图标)
            // this.$refs.upload.onChange(file, this.fileList)
          }
        })
        .catch(error => {
          if (uploader) {
            file.status = 'fail'
            uploader.onError(error, file, this.fileList)
          }
          this.$refs.upload.onChange(file, this.fileList)
        })
    },
    // 请求合并
    chunkMerge() {
      this.fileinfo['group'] = this.group
      this.$notify({
        title: '提示',
        dangerouslyUseHTMLString: true,
        message: '开始合并分片，请耐心等待',
        type: 'info'
      })
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
            // this.$refs.upload.onChange(fileObj, this.fileList)
            this.$refs.upload.onProgress({ percent: 100 })
            // console.log('chunkMerge fileList:', this.getUploadedChunkFiles())
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
// ::v-deep .el-form-item__label {
//   width: 96px !important;
// }
.corew-el-upload-drag-box {
  .corew-el-upload-btn {
    // 按钮上传风格
    .corw-btn-upload-tip {
      padding-left: 10px;
      display: inline-block;
    }
  }
  .corew-el-upload-avatar {
    // 头像上传风格
    :hover {
      border-color: #409eff;
    }
    ::v-deep.el-upload {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      .corew-el-upload-avatar-icon {
        width: 178px;
        height: 178px;
        line-height: 178px;
        font-size: 28px;
        color: #8c939d;
        text-align: center;
      }
    }
    .avatar {
      width: 178px;
      height: 178px;
      display: block;
    }
  }

  .corew-el-upload-pictures {
    // 多图片上传风格
    ::v-deep.el-upload-list--picture-card {
      .el-upload-list__item {
        div:first-child {
          width: 100%;
          height: 100%;
        }
      }
    }
  }

  .corew-el-upload-drag {
    // 拖拽上传风格
    ::v-deep.el-upload-list {
      width: 360px;
      // display: inline-block;
    }
    ::v-deep.el-upload__tip {
      width: 360px;
      // display: inline-block;
    }
  }

  // .el-upload-list {
  //   width: 360px !important;
  //   display: inline-block;
  // }

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
::v-deep .el-input--small .el-input__inner {
  width: 199px;
}

::v-deep .el-date-editor.el-input,
.el-date-editor.el-input__inner {
  width: 199px;
}

::v-deep .el-input-number--small {
  width: 199px !important;
}

.el-textarea {
  width: 509px;
}

.el-divider--horizontal {
  margin: 0 0 15px 0;
}

.tips {
  margin: 0;
  padding: 0;
  color: #999;
  font-size: 12px;
}
.cropper-content {
  display: flex;
  justify-content: flex-end;
  .cropper-box {
    flex: 1;
    width: 100%;
    .cropper {
      width: auto;
      height: 270px;
    }
  }
  .show-preview {
    flex: 1;
    -webkit-flex: 1;
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
