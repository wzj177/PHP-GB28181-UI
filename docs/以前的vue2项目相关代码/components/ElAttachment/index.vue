<template>
  <div class="el-attachment" :class="className">
    <!-- 预览列表 start -->
    <slot v-if="$slots.preview" name="preview"></slot>
    <!-- 文件预览 start-->
    <div class="el-attachment-preview" v-else>
      <div class="el-attachment-preview-body">
        <!-- 已上传文件 列表 start -->
        <div class="el-attacment-preview-imgs" v-if="files.length">
          <template v-for="(item, index) in files">
            <div
              class="el-attachment-preview-img"
              :key="index"
              @mouseover="mouseOver(item)"
              @mouseout="mouseOut(item)"
              :class="canAction(item) ? 'hover' : ''"
              v-if="maxUpdCount === 0 || index <= maxUpdCount - 1"
            >
              <img :src="item.url" :title="index" v-if="item.type === 'image'" />
              <img :src="item.coverFull" :title="index" v-else />
              <span class="el-attachment-preview-img-action">
                <span
                  class="el-attachment-preview-img-action-preview"
                  title="预览"
                  @click="preview(item)"
                >
                  <i class="el-icon-zoom-in"></i>
                </span>
                <span
                  class="el-attachment-preview-img-action-edit"
                  title="替换"
                  @click="update(item)"
                >
                  <i class="el-icon-edit"></i>
                </span>
                <span
                  class="el-attachment-preview-img-action-delete"
                  title="删除"
                  @click="remove(item)"
                >
                  <i class="el-icon-delete"></i>
                </span>
              </span>
            </div>
          </template>
        </div>
        <!-- 已上传文件 列表 end -->
        <!-- 未有已上传文件，展示附件选择按钮 start -->
        <div
          class="el-attachment-preview-icon"
          v-if="maxUpdCount === 0 || files.length < maxUpdCount"
          @click="openDialog()"
        >
          <slot v-if="$slots.previewIcon" name="previewIcon"></slot>
          <i v-else class="el-icon-upload"></i>
        </div>
        <!-- 未有已上传文件，展示附件选择按钮 end -->
      </div>
    </div>
    <!-- 文件预览 end -->
    <!-- 预览列表 end -->
    <!-- 提示 start -->
    <div class="el-upload__tip el-attachment-tip" v-if="tip">{{ tip }}</div>
    <!-- 提示 end -->
    <!-- 弹出附件列表窗口 start -->
    <selector-dialog ref="selector" @selected="onSelected" :limit="maxUpdCount" />
    <!-- 弹出附件列表窗口 end -->
    <!-- 大图预览 start -->
    <preview ref="preview" />
    <!-- 大图预览 end -->
  </div>
</template>
<script>
// 分类 附件 和 上传组件
// 针对其它文件上传使用
import Preview from './preview.vue'
import SelectorDialog from './dialog'
export default {
  name: 'ElAttachment',
  components: {
    SelectorDialog,
    Preview
  },
  props: {
    className: '',
    maxUpdCount: {
      type: Number,
      default: 1
    }, // 如果为0则表示上传不限制数量
    tip: ''
  },
  data() {
    return {
      dialogStatus: false,
      showOptFiles: [],
      files: []
    }
  },
  created() {
  },
  methods: {
    init(files) {
      this.files = files
    },
    mouseOver(file) {
      if (!this.canAction(file)) {
        this.showOptFiles.push(file)
      }
    },
    /**
     * 是否能更新、删除操作
     */
    canAction(file) {
      if (!this.showOptFiles.length) {
        return false
      }

      if ('id' in file) {
        const exist = this.showOptFiles.find(item => item.id === file.id)
        if (exist) {
          return true
        }
      }

      const exist = this.showOptFiles.find(item => item.url === file.url)
      if (exist) {
        return true
      }

      return false
    },
    mouseOut(file) {
      this.showOptFiles = this.showOptFiles.filter(item => {
        if ('id' in item) {
          return item.id !== file.id
        }

        return item.url !== file.url
      })
    },
    preview(file) {
      this.$nextTick(_ => {
        this.$refs.preview.open(file)
      })
    },
    update(file) {
      this.openDialog(file)
    },
    remove(file) {
      this.files = this.files.filter(item => {
        if ('id' in item) {
          return item.id !== file.id
        }

        return item.url !== file.url
      })
      this.$emit('remove', file)
    },
    openDialog(file = null) {
      this.$nextTick(() => {
        this.$refs.selector.open(file)
      })
    },
    onSelected(files) {
      // 选中上传
      console.log('files:', files)
      this.files = files
      this.$emit('success', files)
    }
  }
}
</script>

<style lang="scss" scoped>
.el-attachment {
  .el-attachment-preview {
    cursor: pointer;
    .el-attachment-preview-body {
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
        ::first-child {
          margin-left: 0px;
        }
        &.hover {
          background-color: rgba(0, 0, 0, 0.2);
          /*filter: blur(1px);*/
          box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6),
            0 2px 4px 0 rgba(232, 237, 250, 0.5);
          .el-attachment-preview-img-action {
            opacity: unset;
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
        i {
          font-size: 28px;
          color: #8c939d;
        }
      }
    }
    &:after {
      display: table;
      content: '';
      clear: both;
    }
  }
}
</style>
