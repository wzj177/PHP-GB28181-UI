<template>
  <div class="container">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="基础配置" name="basic">
        <basic-tab ref="basicTab" />
      </el-tab-pane>
      <el-tab-pane label="附件配置" name="attachment">
        <attachment-tab ref="attachmentTab" />
      </el-tab-pane>
      <el-tab-pane label="会员端配置" name="vip">
        <vip-tab ref="vipTab" />
      </el-tab-pane>
      <el-tab-pane label="IP名单" name="ip">
        <ip-tab ref="ipTab" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'SettingIndex',
  components: {
    BasicTab: () => import('./tabs/basic.vue'),
    AttachmentTab: () => import('./tabs/attachment'),
    VipTab: () => import('./tabs/vip.vue'),
    IpTab: () => import('./tabs/ip-check.vue')
  },
  data() {
    return {
      activeName: 'basic'
    }
  },
  mounted() {},
  methods: {
    handleClick(tab, event) {
      const activeTabRefKey = `${tab.name}Tab`
      this.$refs[activeTabRefKey].initDataSource()
    }
  }
}
</script>
<style lang="scss" scoped></style>
