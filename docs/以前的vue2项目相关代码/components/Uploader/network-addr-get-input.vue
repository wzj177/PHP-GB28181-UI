<template>
  <div :class="customClass">
    <el-input
      :placeholder="placeholder"
      ref="netInput"
      :value="value"
      @input="$emit('input', $event)"
      clearable
    >
      <template slot="prepend">[http|https]://</template>
      <template slot="append">
        <el-button type="primary" class="net-btn" @click.stop="uploadRemoteFile" :loading="loading">
          {{btnText}}
          <i class="el-icon-upload el-icon--right"></i>
        </el-button>
      </template>
    </el-input>
    <div class="el-upload__tip">{{tips}}</div>
  </div>
</template>
<script>
import { validURL } from '@/utils/validate'
import { useAttachmentApi } from '@/api/attachment'

const attachmentAPI = useAttachmentApi()

export default {
  name: 'NetworkAddrGetInput',
  // model: {
  //   prop: 'value',
  //   emit: 'input'
  // },
  props: {
    value: {
      type: String
    },
    group: {
      type: String,
      default: 'default'
    },
    customClass: {
      type: String,
      default: 'attachment-selector-network'
    },
    placeholder: {
      type: String,
      default: '请在此处粘贴图片地址'
    },
    tips: {
      type: String,
      default:
        '需要[http|https]://.........大小不要超过10M,支持图片类型gif,jpg,png,jpeg'
    },
    btnText: {
      type: String,
      default: '提取图片'
    },
    validateFunction: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      loading: false
    }
  },
  methods: {
    uploadRemoteFile() {
      if (!validURL(this.value)) {
        this.$message.error('输入的资源地址有误')
        this.$refs.netInput.$el.childNodes[1].value = ''
        return false
      }
      if (this.validateFunction instanceof Function) {
        const { code, msg } = this.validateFunction(this.value)
        if (code !== 'ok') {
          this.$message.error(msg)
          this.$refs.netInput.$el.childNodes[1].value = ''
          return false
        }
      }
      this.loading = true
      attachmentAPI
        .uploadRemoteFile({
          url: this.value,
          group: this.group
        })
        .then(file => {
          this.$notify({
            title: '成功提示',
            dangerouslyUseHTMLString: true,
            message: '提取成功',
            type: 'success'
          })
          this.$emit('ok', file)
          this.loading = false
        })
        .catch(error => {
          this.$notify({
            title: '失败提示',
            dangerouslyUseHTMLString: true,
            message: '提取失败，' + error.message,
            type: 'success'
          })
          this.$emit('error', error)
          this.loading = false
        })
    }
  }
}
</script>
<style lang="scss" scoped>
.attachment-selector-network {
  height: 410px;
  width: 75%;
  margin: 0 auto;
  padding-top: 120px;
}
::v-deep.el-input {
  .el-input-group__append {
    cursor: pointer;
  }
}
::v-deep.net-btn.el-button--medium {
  padding: 11px 20px !important;
  border-radius: 0 !important;
}
</style>