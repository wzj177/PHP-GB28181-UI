<template>
  <div class="container">
    <el-tabs v-model="activeName" type="border-card" @tab-click="handleClick">
      <el-tab-pane label="远程存储" name="storage">
        <storage-tab ref="storageTab" />
      </el-tab-pane>
      <el-tab-pane label="CDN" name="cdn">
        <cdn-tab ref="cdnTab" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'SettingSecure',
  components: {
    StorageTab: () => import('./tabs/storage.vue'),
    CdnTab: () => import('./tabs/cdn.vue')
  },
  data() {
    return {
      activeName: 'storage'
    }
  },
  methods: {
    handleClick(tab, event) {
      const activeTabRefKey = `${tab.name}Tab`
      this.$refs[activeTabRefKey].initDataSource()
    }
  }
}
</script>
<style lang="scss" scoped></style>
