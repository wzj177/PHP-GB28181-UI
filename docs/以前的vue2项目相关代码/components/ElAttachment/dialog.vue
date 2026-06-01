<template>
  <el-dialog
    :visible.sync="visible"
    :width="width"
    class="attachment-selector"
    @close="onDialogClose"
  >
    <div slot="title" class="attachment-selector-header">
      <div class="title">添加图片</div>
      <div class="storage-content">（当前托管方式：托管存储本地存储）</div>
    </div>
    <div class="attachment-selector-body">
      <el-tabs @tab-click="handleClick" v-model="activeTab" stretch>
        <el-tab-pane label="本地图片" name="local" class="selector-tab-item">
          <div class="attachment-selector-local">
            <div class="group">
              <group ref="group" custom-class />
            </div>
            <div class="list">
              <div class="list-header">
                <div class="btn">
                  <uploader
                    style-mode="btn"
                    :accept="accept"
                    @success="search"
                  />
                </div>
                <div class="search search-keyword">
                  <el-input
                    v-model="searchModel.keyword"
                    placeholder="请输入附件名称搜索"
                    class="search-input"
                    clearable
                    @clear="search(true)"
                  >
                    <el-button
                      slot="append"
                      icon="el-icon-search"
                      @click.stop="search"
                    ></el-button>
                  </el-input>
                  <el-button
                    type="text"
                    @click="openOrCloseMore"
                    class="open-more-btn"
                  >
                    {{ openMore ? '收起' : '展开' }}
                    <i
                      :class="
                        !openMore ? 'el-icon-arrow-up ' : 'el-icon-arrow-down'
                      "
                    ></i>
                  </el-button>
                </div>
              </div>
              <div class="list-more-search" v-if="openMore">
                <el-date-picker
                  v-model="searchTimeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  :picker-options="pickerOptions"
                  value-format="yyyy-MM-dd HH:mm"
                  @change="changeDate"
                ></el-date-picker>
              </div>
              <div class="list-content" v-loading="loading">
                <ul>
                  <li v-for="(file, index) in fileList" :key="file.id">
                    <div class="file" @click.stop="onFileClick(file, index)">
                      <el-image
                        key="fill"
                        :src="file.coverFull"
                        :lazy="file.type === 'image' ? true : false"
                      >
                        <div slot="error" class="image-slot">
                          <i class="el-icon-picture-outline"></i>
                        </div>
                      </el-image>
                      <div class="layer">
                        <div class="close-btn" @click.stop="delFile(file)">
                          <i class="el-icon-circle-close"></i>
                        </div>
                        <div class="image-size" v-if="file.imgSize != null">
                          {{ file.imgSize.width }} x {{ file.imgSize.height }}
                        </div>
                      </div>
                      <div class="image-select-layer" v-show="isSelected(file)">
                        <i class="el-icon-circle-check"></i>
                      </div>
                    </div>
                    <div class="text" :title="file.filename">
                      <span>{{ file.filename }}</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="list-footer">
                <div class="list-batch-delete">
                  <el-button
                    type="default"
                    @click.stop="delFiles"
                    :disabled="selectedFiles.length === 0"
                    >删除选中（{{ selectedFiles.length }}）</el-button
                  >
                </div>
                <div class="list-pagination">
                  <pagination
                    v-show="total > 0"
                    :total="total"
                    :page.sync="searchModel.page"
                    :limit.sync="searchModel.page_size"
                    @pagination="getFiles"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="网络提取" name="network" class="selector-tab-item">
          <network-addr-get-input
            v-model="sourceUrl"
            :validate-function="validateSourceUrl"
            @ok="onSuccessGetRemoteSource"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
    <div slot="footer" class="attachment-selector-footer">
      <el-button @click="close">取 消</el-button>
      <el-button type="info" @click="previewImgs" v-if="fileType === 'image'"
        >预 览</el-button
      >
      <el-button type="primary" @click="sure">确 定</el-button>
    </div>
    <preview ref="preview" />
  </el-dialog>
</template>

<script>
import { getFileAcceptByFileType } from '@/utils/index'
import Group from './components/group'
import Uploader from '../Uploader/index.vue'
import { useAttachmentApi } from '@/api/attachment'
import Pagination from '@/components/Pagination'
const attachmentAPI = useAttachmentApi()
const defaultQuery = {
  page: 1,
  page_size: 10,
  type: undefined,
  keyword: undefined,
  start_time: undefined,
  end_time: undefined
}

// validate img
const validateImg = url => {
  // 允许的图片扩展名数组
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.svg',
    '.webp'
  ]
  // 获取 URL 的文件扩展名
  const extension = url.substring(url.lastIndexOf('.')).toLowerCase()
  // 判断扩展名是否在允许的图片扩展名数组中
  const result = imageExtensions.includes(extension)
  if (result) {
    return { code: 'ok', msg: '' }
  }

  return { code: 'error', msg: '请输入正确的图片资源地址' }
}

export default {
  name: 'SelectorDialog',
  components: {
    Uploader,
    Group,
    Pagination,
    NetworkAddrGetInput: () => import('../Uploader/network-addr-get-input.vue'),
    Preview: () => import('./preview.vue')
  },
  props: {
    width: {
      type: String,
      default: '1100px'
    },
    fileType: {
      type: String,
      default: 'image' // image=图片,audio=音频,video=视频,other=其它类型文件 ''=所有类型文件
    },
    limit: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      visible: false,
      activeTab: 'local',
      typeOptions: [],
      loading: false,
      fileList: [],
      sourceUrl: '', // 网络提取资源 URL
      searchModel: Object.assign({}, defaultQuery),
      searchTimeRange: [],
      paginator: null,
      openMore: false,
      checkedFiles: null,
      selectedFiles: [],
      updFile: null, // 更新操作：待更新文件，回显
      pickerOptions: {
        shortcuts: [
          {
            text: '最近一周',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },
      remoteSourceFile: null, // 网络资源
      validateSourceUrl: url => {
        return { code: 'ok', msg: '' }
        // if (this.fileType !== 'image') {
        //   return { code: 'ok', msg: '' }
        // }

        // return validateImg(url)
      }
    }
  },
  computed: {
    total() {
      return this.paginator ? this.paginator.total : 0
    },
    accept() {
      return getFileAcceptByFileType(this.fileType)
    }
  },
  created() {},
  methods: {
    removeSelectedFile(file) {
      this.selectedFiles = this.selectedFiles.filter(item => {
        if ('id' in item) {
          return item.id !== file.id
        } else {
          return item.url !== file.url
        }
      })
    },
    onFileClick(file, index) {
      if (this.limit > 1 && this.selectedFiles.length >= this.limit) {
        return false
      }

      if (!this.isSelected(file)) {
        if (this.limit === 1 && this.selectedFiles.length) {
          this.selectedFiles = []
        }

        this.selectedFiles.push(file)
      } else {
        this.removeSelectedFile(file)
        // if (this.limit === 1) {
        //   this.selectedFiles = []
        // } else {

        // }
      }
    },
    init() {
      this.getTypeOptions()
      this.getFiles()
    },
    changeDate(_val) {
      // this.$forceUpdate()
      if (_val instanceof Array && _val.length === 2) {
        this.searchModel.start_time = _val[0]
        this.searchModel.end_time = _val[1]
      } else {
        this.searchModel.start_time = undefined
        this.searchModel.end_time = undefined
      }

      this.search()
    },
    async getTypeOptions() {
      this.typeOptions = await attachmentAPI.typeOptions()
    },
    search(resetFlag = false) {
      if (resetFlag) {
        this.searchModel = Object.assign({}, defaultQuery)
      }
      this.getFiles()
    },
    async getFiles() {
      this.loading = true
      this.searchModel.type = this.fileType
      const { list, paginator } = await attachmentAPI.files(this.searchModel)
      if (!list.length && this.paginator.currentPage !== 1) {
        this.$set(this.searchModel, 'page', this.paginator.currentPage - 1)
        this.getFiles()
        return
      }

      this.fileList = list
      this.paginator = paginator
      this.$nextTick(_ => {
        this.selectUpdFile()
      })
      setTimeout(() => {
        this.loading = false
      }, 1000)
    },
    isSelected(file) {
      if (!this.selectedFiles.length) {
        return false
      }

      let obj = undefined
      if ('id' in file) {
        obj = this.selectedFiles.find(item => item.id == file.id)
      }

      if (obj === undefined && 'url' in file) {
        obj = this.selectedFiles.find(item => item.url == file.url)
      }

      return obj !== undefined
    },
    selectUpdFile() {
      if (!this.updFile || this.isSelected(this.updFile)) {
        return
      }

      this.selectedFiles.push(this.updFile)
    },
    delFiles() {
      if (this.selectedFiles.length <= 0) {
        this.$message.error('删除失败，请至少选择一项附件')
        return false
      }
      this.$confirm('确定要删除它们吗?', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          await attachmentAPI.deletes(this.selectedFiles)
          this.selectedFiles = []
          this.updFile = null
          this.$message({
            type: 'success',
            message: '删除成功'
          })
          this.search()
        })
        .catch(err => {
          console.error(err)
        })
    },
    delFile(file) {
      this.$confirm('确定要删除吗?', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          await attachmentAPI.delete(file.id)
          this.delSelectedFile([file])
          this.$message({
            type: 'success',
            message: '删除成功'
          })
          this.search()
        })
        .catch(err => {
          console.error(err)
        })
    },
    delSelectedFile(files) {
      for (const k in files) {
        if (files[k].url === this.updFile.url) {
          this.updFile = null
        }
        this.removeSelectedFile(files[k])
      }
    },
    open(updFile = null) {
      this.updFile = updFile
      this.init()
      this.visible = true
    },
    close() {
      this.visible = false
      this.selectedFiles = []
      this.updFile = null
    },
    onDialogClose() {
      this.selectedFiles = []
      this.updFile = null
    },
    onSuccessGetRemoteSource(file) {
      file.filepath = file.path
      delete file.path
      this.remoteSourceFile = file
    },
    sure() {
      if (this.activeTab === 'network') {
        this.$emit(
          'selected',
          this.remoteSourceFile ? [this.remoteSourceFile] : []
        )
      } else {
        this.$emit('selected', this.selectedFiles)
      }
      this.visible = false
      this.selectedFiles = []
      this.updFile = null
    },
    previewImgs() {
      this.$nextTick(() => {
        this.$refs.preview.openImages(
          this.fileList
            .filter(item => item.type === 'image')
            .map(item => item.url)
        )
      })
    },
    handleClick(tab) {},
    openOrCloseMore() {
      this.openMore = !this.openMore
    }
  }
}
</script>
<style lang="scss" scoped>
.attachment-selector {
  .attachment-selector-header {
    padding: 3px 4px;
    height: 20px;
    display: flex;
    align-items: center;
    .title {
      font-size: 16px;
      font-weight: bold;
      line-height: 22px;
      color: #000;
    }
    .storage-content {
      padding-left: 20px;
      font-size: 14px;
      font-weight: normal;
      line-height: 20px;
      color: #939799;
    }
  }
  .attachment-selector-body {
    ::v-deep .el-tabs__nav-scroll {
      width: 50%;
      margin: 0 auto;
    }
    .attachment-selector-local {
      display: flex;
      flex-wrap: nowrap;
      .group {
        min-width: 200px;
        max-width: 200px;
        border-right: 1px solid #e9edef;
        overflow-x: hidden;
        overflow-y: auto;
      }
      .list {
        // padding: 0 20px;
        padding-left: 10px;
        width: 100%;
        overflow-y: auto;
        .list-header {
          padding-top: 20px;
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
          padding-bottom: 10px;
          .btn {
            flex: 1;
            .el-button {
              margin-right: 10px;
            }
            .text {
              font-size: 12px;
            }
          }
          .search {
            .search-input {
              width: 340px;
            }
            .el-icon-search {
            }
            .open-more-btn {
              margin-left: 10px;
            }
          }
        }
        .list-content {
          overflow-y: auto;
          overflow-x: hidden;
          // height: 400px;
          max-height: 400px;
          padding-top: 10px;
          ul {
            display: flex;
            flex-wrap: wrap;
            margin-right: -10px;
            li {
              padding: 0 10px 20px 0;
              .file {
                position: relative;
                width: 112px;
                height: 112px;
                border: 1px solid #e9edef;
                border-radius: 2px;
                cursor: pointer;
                background-color: #f4f6f8;
                &:hover {
                  .layer {
                    display: block;
                  }
                }
                .el-image {
                  width: 100%;
                  height: 100%;
                  display: block;
                }
                .layer {
                  display: none;
                  .close-btn {
                    position: absolute;
                    top: -18px;
                    right: -9px;
                    font-size: 20px;
                    color: #b8b9bd;
                    &:hover {
                      color: #515a6e;
                    }
                    .el-icon-circle-close {
                      font-size: 24px;
                    }
                  }
                  .image-size {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 20px;
                    line-height: 20px;
                    text-align: center;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: #ffffff;
                    font-size: 12px;
                  }
                }
                .image-select-layer {
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  background-color: rgba(0, 0, 0, 0.7);
                  display: flex;
                  border-radius: 2px;
                  .el-icon-circle-check {
                    display: inline-block;
                    margin: auto;
                    color: #1198a0;
                    font-size: 30px;
                  }
                }
              }
              .text {
                font-size: 12px;
                line-height: 16px;
                color: #000;
                margin-top: 10px;
                width: 112px;
                display: flex;
                span {
                  word-break: break-all;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  overflow: hidden;
                }
              }
            }
          }
        }
        .list-footer {
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
          padding: 10px 0;
          background-color: #ffffff;
        }
      }
    }
  }
  .attachment-selector-footer {
  }
}
</style>
